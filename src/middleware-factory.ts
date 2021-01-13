import type { AccountsMiddlewareFactory, JwtConfig, AccessTokenPayload, RefreshTokenPayload, Configuration } from '@via-profit-services/accounts';
import { Middleware, ServerError } from '@via-profit-services/core';
import fs from 'fs';
import '@via-profit-services/sms';

import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  REDIS_TOKENS_BLACKLIST,
} from './constants';
import contextMiddleware from './context-middleware';
import UnauthorizedError from './UnauthorizedError';
import validationRuleMiddleware from './validation-rule-middleware';

const accountsMiddlewareFactory: AccountsMiddlewareFactory = async (props) => {

  const configuration: Configuration = {
    requireAuthorization: true, // default value
    enableIntrospection: process.env.NODE_ENV === 'development', // default value
    ...props,
  }

  const {
    privateKey, publicKey, algorithm, issuer,
    refreshTokenExpiresIn, accessTokenExpiresIn,
  } = configuration;


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
    extensions: null,
  };

  const timers: { blacklist: NodeJS.Timeout } = {
    blacklist: null,
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

    if (typeof context.services.sms === 'undefined') {
      throw new ServerError(
        '«@via-profit-services/sms is missing. If sms middleware is already connected, make sure that the connection order is correct: sms middleware must be connected before',
      );
    }

    // define static context at once
    pool.context = pool.context ?? await contextMiddleware({
      jwt,
      config: props.config,
      context: context,
      configuration,
    });

    const { services, redis } = pool.context;
    const { authentification } = services;

    // extract token
    pool.context.token = authentification.getDefaultTokenPayload();
    pool.extensions = {
      tokenPayload: pool.context.token,
    };


    // setup it once
    // setup timer to clear expired tokens
    if (!timers.blacklist) {
      timers.blacklist = setInterval(() => {
        authentification.clearExpiredTokens();
      }, jwt.accessTokenExpiresIn * 1000);
    }
    // try to parse token
    const bearerToken = authentification.extractTokenFromRequest(request);

    if (bearerToken) {
      let tokenPayload: AccessTokenPayload | RefreshTokenPayload;

      try {
        tokenPayload = await authentification.verifyToken(bearerToken);

      } catch (err) {
        throw new UnauthorizedError(err.message);
      }

      if (authentification.isRefreshTokenPayload(tokenPayload)) {
        throw new UnauthorizedError(
          'This is token are «Refresh» token type. You should provide «Access» token type',
        );
      }

      const revokeStatus = await redis.sismember(REDIS_TOKENS_BLACKLIST, tokenPayload.id);
      if (revokeStatus) {
        throw new UnauthorizedError('Token was revoked');
      }

      pool.context.emitter.emit('got-access-token', tokenPayload);
      pool.context.token = tokenPayload;
      pool.extensions.tokenPayload = tokenPayload;
    }

    pool.validationRule = await validationRuleMiddleware({
      context: pool.context,
      config: props.config,
      configuration,
    });

    return pool;
  }

  return middleware;
}

export default accountsMiddlewareFactory;
