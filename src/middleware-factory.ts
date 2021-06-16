import type { AccountsMiddlewareFactory, JwtConfig } from '@via-profit-services/accounts';
import { Middleware, ServerError } from '@via-profit-services/core';
import fs from 'fs';
import '@via-profit-services/sms';
import DataLoader from '@via-profit/dataloader';

import authLogger from './auth-logger';
import AccountsService from './services/AccountsService';
import AuthentificationService from './services/AuthentificationService';
import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  REDIS_TOKENS_BLACKLIST,
  TIMEOUT_MAX_INT,
} from './constants';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';

const SYMBOL_PROCESSED: string = Symbol('processed') as any;

const accountsMiddlewareFactory: AccountsMiddlewareFactory = async (configuration) => {

  const {
    privateKey, publicKey, algorithm, issuer, entities,
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

  interface Cache {
    typesTableInit: boolean;
  }

  const cache: Cache = {
    typesTableInit: false,
  };

  const timers: { blacklist: NodeJS.Timeout } = {
    blacklist: null,
  };


  const typeList = new Set(
    [...entities || []].map((entity) => entity.replace(/[^a-zA-Z]/g, '')),
  );
  typeList.add('User');

  const middleware: Middleware = async ({ context, schema, config }) => {

    const { logDir } = config;

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

    // JsonWebToken settings
    context.jwt = jwt;

    // Accounts Service
    context.services.accounts = new AccountsService({ context, entities });

    // Authentification Service
    context.services.authentification = new AuthentificationService({ context });

    // Default token state
    context.token = context.services.authentification.getDefaultTokenPayload();

    // Authorization Logger
    context.logger.auth = authLogger({ logDir });

    // Accounts Dataloader
    context.dataloader.accounts = new DataLoader(async (ids: string[]) => {
      const nodes = await context.services.accounts.getAccountsByIds(ids);

      return nodes;
    }, {
      redis: context.redis,
      cacheName: 'accounts',
      defaultExpiration: '1min',
    });


    // check to init tables
    if (!cache.typesTableInit) {
      await context.services.accounts.rebaseTypes([...typeList]);
      cache.typesTableInit = true;
    }

    // setup it once
    // setup timer to clear expired tokens
    if (!timers.blacklist) {
      timers.blacklist = setInterval(() => {
        context.services.authentification.clearExpiredTokens();
      }, Math.min(jwt.accessTokenExpiresIn * 1000, TIMEOUT_MAX_INT));
    }

    const { services, redis, logger } = context;
    const { authentification } = services;

    try {
      const requestToken = authentification.extractTokenFromRequest(context.request);
      if (requestToken) {

        const payload = await authentification.verifyToken(requestToken);
        const isRevoked = await redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);

        // if is a valid access token then inject it into the context
        if (authentification.isAccessTokenPayload(payload) && !isRevoked) {
          context.token = payload;
        }

        if (isRevoked) {
          logger.auth.debug('Token verification error in accounts middlweare. Token revoked');
        }
      }

    } catch (err) {
      throw new Error(err);
    }

    return {
      context,
    };
  }


  return {
    middleware,
    resolvers,
    typeDefs: `
      ${typeDefs}
      union AccountEntity = ${[...typeList].join(' | ')}
      enum AccountType {
        ${[...typeList].join(',\n')}
      }
      `,
  };
}

export default accountsMiddlewareFactory;
