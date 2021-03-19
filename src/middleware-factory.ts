import type { AccountsMiddlewareFactory, JwtConfig, AccessTokenPayload, RefreshTokenPayload, } from '@via-profit-services/accounts';
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
  ACCESS_TOKEN_EMPTY_ID,
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






// return pool;
    // const skip = [
    //   'AuthentificationMutation.create',
    //   'AuthentificationMutation.refresh',
    //   'AuthentificationMutation.reset',
    //   'AuthentificationQuery.verifyToken',
    // ];

    // let token: string | false;
    // const { authentification } = services;
    // console.log(request.headers);
    // console.log('')
    // console.log('')
    // console.log('')
    // console.log('----')
    // const requestToken = authentification.extractTokenFromRequest(request);
    // pool.context.token = authentification.getDefaultTokenPayload();
    // const getToken = () => ;
    // context.token =
    // console.log({ requestToken });
    // console.log(request.headers);
    // console.log('Headers Authorization are passed', request.headers['authorization'] !== undefined)
    // const getToken = async () => {
    //   const defaultToken = authentification.getDefaultTokenPayload();

    //   try {
    //     const requestToken = authentification.extractTokenFromRequest(request);
    //     if (requestToken) {
    //       const payload = await authentification.verifyToken(requestToken);

    //       const isRevoked = await redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);
    //       if (authentification.isAccessTokenPayload(payload) && !isRevoked) { 
    //         return payload;
    //       }
    //     }

    //   } catch (err) {
    //     // context.token = authentification.getDefaultTokenPayload();
    //     console.log(err.message);
    //     // do nothing
    //   }
    //   return defaultToken;
    // }


    // pool.schema = pool.schema && 
    // if (!pool.schema || pool.schema) {

      // pool.schema = schema;
      const types = schema.getTypeMap();
      // let token: AccessTokenPayload = context.services.authentification.getDefaultTokenPayload();
      
      Object.entries(types).forEach(([typeName, type]) => {

        if (isObjectType(type) && !isIntrospectionType(type)) {
          const fieldMap = type.getFields();

          if ((type as any)[SYMBOL_PROCESSED]) {
            return;
          }

          (type as any)[SYMBOL_PROCESSED] = true;

          Object.entries(fieldMap).forEach(([fieldName, field]) => {
            const { resolve } = field;

            if ((field as any)[SYMBOL_PROCESSED]) {
              return;
            }

            (field as any)[SYMBOL_PROCESSED] = true;

            if (resolve) {

              field.resolve = async (parent, args, context: Context, info) => {

                if ([
                  'AuthentificationMutation.create',
                  'AuthentificationMutation.refresh',
                  'AuthentificationMutation.reset',
                  'AuthentificationQuery.verifyToken',
                ].includes(`${typeName}.${fieldName}`)) {
                  return (await resolve(parent, args, context, info));
                }

                if (['Query', 'Mutation', 'Subscription'].includes(typeName)) {
                  
                  // console.log('Reset token in field', typeName);
                  // console.log('headers', context.request.headers);
                  // token = authentification.getDefaultTokenPayload();

                  try {
                    const requestToken = context.services.authentification.extractTokenFromRequest(context.request);
                    if (requestToken) {
                      const payload = await context.services.authentification.verifyToken(requestToken);
                      // console.log('token verification');
                      const isRevoked = await context.redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);
                      if (context.services.authentification.isAccessTokenPayload(payload) && !isRevoked) { 
                        // console.log('Apply new token with ID', payload.id);
                        // token = payload;
                        context.token = payload;
                      }
                    }

                  } catch (err) {
                    // do nothing
                  }
                  // console.log(`${typeName}.${fieldName}`, context.request.headers['authorization']);

                  // console.log(`${typeName}.${fieldName}`);

                  // context.token = authentification.getDefaultTokenPayload();
                  
                }


                // const { parentType } = info;
                // const { request } = context;

                // const token = authentification.extractTokenFromRequest(request);
                // context.token = authentification.getDefaultTokenPayload();
                // let tokenPayload: AccessTokenPayload | RefreshTokenPayload;

                // // if (token !== false && !skip.includes(`${parentType}.${fieldName}`) && context.token.id === ACCESS_TOKEN_EMPTY_ID) {
                // if (token) {
                //   try {
                //     tokenPayload = await authentification.verifyToken(token);

                //   } catch (err) {
                //     context.token = authentification.getDefaultTokenPayload();
                //     console.log(err.message);
                //   }

                //   const isRevoked = await redis.sismember(REDIS_TOKENS_BLACKLIST, tokenPayload.id);
                //   if (isRevoked) {
                //     console.log('Token was revoked');
                //   }

                //   if (authentification.isAccessTokenPayload(tokenPayload) && !isRevoked) {
                //     context.token = tokenPayload;
                //   }
                // }
                // context.token = await getToken();
                // console.log(token.id)
                return (await resolve(parent, args, context, info));
              }
            }
          });
        }
      });

      // pool.schema = schema;
    // }
    


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
