import type { AccountsMiddlewareFactory, JwtConfig } from '@via-profit-services/accounts';
import { Middleware, ServerError, Context, collateForDataloader } from '@via-profit-services/core';
import fs from 'fs';
import '@via-profit-services/sms';
import { isObjectType, isIntrospectionType } from 'graphql';
import DataLoader from 'dataloader';

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

      return collateForDataloader(ids, nodes);
    });


    const types = schema.getTypeMap();

    // walk all schema types and wrap field resolvers
    Object.entries(types).forEach(([typeName, type]) => {

      // skip if is not an object type or introspection
      // also skip if type already affected (`SYMBOL_PROCESSED` marker)
      if (!isObjectType(type) || isIntrospectionType(type) || (type as any)[SYMBOL_PROCESSED]) {
        return;
      }

      const fieldMap = type.getFields();

      // mark this type as affected
      (type as any)[SYMBOL_PROCESSED] = true;

      Object.entries(fieldMap).forEach(([fieldName, field]) => {
        const { resolve } = field;

        // skip if type already affected or resolver is missing
        if ((field as any)[SYMBOL_PROCESSED] || !resolve) {
          return;
        }

        // mark this field as affected
        (field as any)[SYMBOL_PROCESSED] = true;

        // replace original resolver to this
        field.resolve = async (parent, args, context: Context, info) => {

          // this will be token creation/verification and etc.
          const isAuthentificationOperation = [
            'AuthentificationMutation.create',
            'AuthentificationMutation.refresh',
            'AuthentificationMutation.reset',
            'AuthentificationQuery.verifyToken',
          ].includes(`${typeName}.${fieldName}`);
          
          const isRootField = [
            'Query',
            'Mutation',
            'Subscription',
          ].includes(typeName);

          // we should skip this operations without token verification
          // if is not a root fields and this is not
          // a token creation/verification operations
          if (!isRootField || isAuthentificationOperation) {
            return (await resolve(parent, args, context, info));
          }

          try {
            const requestToken = context.services.authentification.extractTokenFromRequest(context.request);
            if (requestToken) {
              const payload = await context.services.authentification.verifyToken(requestToken);
              const isRevoked = await context.redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);
              
              // if is a valid access token then inject it into the context
              if (context.services.authentification.isAccessTokenPayload(payload) && !isRevoked) { 
                context.token = payload;
              }
            }

          } catch (err) {
            // do nothing, error of token verification
            // will be showed from resolvers
          }

          return (await resolve(parent, args, context, info));
        }
        
      });
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

    return {
      schema,
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
