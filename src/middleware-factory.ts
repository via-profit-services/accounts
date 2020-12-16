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
    privateKey, publicKey, algorithm, issuer,
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

  const middleware: Middleware = async (props) => {

    const { request } = props;

    // define static context at once
    pool.context = pool.context ?? contextMiddleware({
      jwt,
      config: props.config,
      context: props.context,
    });

    // try to parse token
    const bearerToken = pool.context.services.accounts.extractTokenFromRequest(request);
    if (bearerToken) {
      const bearerTokenPayload = await pool.context.services.accounts.verifyToken(bearerToken);
      pool.context.token = bearerTokenPayload
        ? bearerTokenPayload
        : pool.context.services.accounts.getDefaultTokenPayload();
    }


    pool.validationRule = pool.validationRule ?? validationRuleMiddleware({
      context: pool.context,
    });


    return pool;
  }

  return middleware;
}

export default accountsMiddlewareFactory;
