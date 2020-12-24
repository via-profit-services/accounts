import type { AccountsMiddlewareFactory, JwtConfig } from '@via-profit-services/accounts';
import { Middleware, ServerError } from '@via-profit-services/core';
import fs from 'fs';

import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
} from './constants';
import contextMiddleware from './context-middleware';
import validationRuleMiddleware from './validation-rule-middleware';

const accountsMiddlewareFactory: AccountsMiddlewareFactory = async (config) => {
  const {
    privateKey, publicKey, algorithm, issuer, permissionsMap,
    refreshTokenExpiresIn, accessTokenExpiresIn,
  } = config;


  const jwt: JwtConfig = {
    issuer: issuer || DEFAULT_SIGNATURE_ISSUER,
    algorithm: algorithm || DEFAULT_SIGNATURE_ALGORITHM,
    accessTokenExpiresIn: accessTokenExpiresIn || DEFAULT_ACCESS_TOKEN_EXPIRED,
    refreshTokenExpiresIn: refreshTokenExpiresIn || DEFAULT_REFRESH_TOKEN_EXPIRED,
    privateKey: Buffer.from(''),
    publicKey: Buffer.from(''),
  };

  try {
    jwt.privateKey = typeof privateKey === 'string' ? fs.readFileSync(privateKey) : privateKey;
    jwt.publicKey = typeof publicKey === 'string' ? fs.readFileSync(publicKey) : publicKey;
  } catch (err) {
    throw new ServerError('Failed to get private or/and public keys', err);
  }

  const pool: ReturnType<Middleware> = {
    context: null,
    validationRule: null,
  };

  const timers: { blacList: NodeJS.Timeout } = {
    blacList: null,
  };

  const middleware: Middleware = async (props) => {

    const { request, context } = props;

    // check knex dependencies
    if (typeof context.knex === 'undefined') {
      throw new ServerError(
        '«@via-profit-services/knex» middleware is missing. If knex middleware is already connected, make sure that the connection order is correct: knex middleware must be connected before',
      );
    }
    if (typeof context.redis === 'undefined') {
      throw new ServerError(
        '«@via-profit-services/redis is missing. If redis middleware is already connected, make sure that the connection order is correct: redis middleware must be connected before',
      );
    }

    // define static context at once
    pool.context = pool.context ?? contextMiddleware({
      jwt,
      config: props.config,
      context: context,
    });

    const { services } = pool.context;

    // setup it once
    // setup timer to clear expired tokens
    if (!timers.blacList) {
      timers.blacList = setInterval(() => {
        services.accounts.clearExpiredTokens();
      }, jwt.accessTokenExpiresIn * 1000);
    }

    // try to parse token
    const bearerToken = services.accounts.extractTokenFromRequest(request);
    if (bearerToken) {

      const bearerTokenPayload = await services.accounts.verifyToken(bearerToken);

      pool.context.token = bearerTokenPayload
        ? bearerTokenPayload
        : services.accounts.getDefaultTokenPayload();
    }


    pool.validationRule = validationRuleMiddleware({
      context: pool.context,
      config: props.config,
      permissionsMap,
    });


    return pool;
  }

  return middleware;
}

export default accountsMiddlewareFactory;
