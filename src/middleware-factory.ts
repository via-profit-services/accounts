import type { AccountsMiddlewareFactory, JwtConfig, AccessTokenPayload, RefreshTokenPayload } from '@via-profit-services/accounts';
import { Middleware, ServerError, Context } from '@via-profit-services/core';
import fs from 'fs';
import '@via-profit-services/sms';
import { isObjectType, isIntrospectionType } from 'graphql';

import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  ACCESS_TOKEN_EMPTY_ID,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  REDIS_TOKENS_BLACKLIST,
  TIMEOUT_MAX_INT,
} from './constants';
import contextMiddleware from './context-middleware';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';

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

  const pool: ReturnType<Middleware> = {
    context: null,
    validationRule: null,
    extensions: null,
    schema: null,
  };

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

  const middleware: Middleware = async (props) => {

    const { request, context, schema } = props;

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
      context,
      configuration,
    });

    pool.context.request = request;


    const skip = [
      'AuthentificationMutation.create',
      'AuthentificationMutation.refresh',
      'AuthentificationMutation.reset',
      'AuthentificationQuery.verifyToken',
    ];

    // let token: string | false;
    const { services, redis } = pool.context;
    const { authentification } = services;
    

    // pool.schema = pool.schema && 
    if (!pool.schema) {

      pool.schema = schema;
      const types = pool.schema.getTypeMap();
      Object.entries(types).forEach(([typeName, type]) => {

        if (isObjectType(type) && !isIntrospectionType(type)) {
          const fieldMap = type.getFields();

          Object.entries(fieldMap).forEach(([fieldName, field]) => {
            const { resolve } = field;

            if (resolve) {

              field.resolve = async (parent, args, context: Context, info) => {
                const { parentType } = info;
                const { request } = context;

                const token = authentification.extractTokenFromRequest(request);
                context.token = authentification.getDefaultTokenPayload();
                let tokenPayload: AccessTokenPayload | RefreshTokenPayload;

                if (token !== false && !skip.includes(`${parentType}.${fieldName}`) && context.token.id === ACCESS_TOKEN_EMPTY_ID) {
                  try {
                      tokenPayload = await authentification.verifyToken(token);

                  } catch (err) {
                    throw new ServerError(err.message);
                  }

                  if (authentification.isRefreshTokenPayload(tokenPayload)) {
                    throw new ServerError(
                      'This is token are «Refresh» token type. You should provide «Access» token type',
                    );
                  }

                  const revokeStatus = await redis.sismember(REDIS_TOKENS_BLACKLIST, tokenPayload.id);
                  if (revokeStatus) {
                    throw new ServerError('Token was revoked');
                  }

                  context.token = tokenPayload;
                }

                return (await resolve(parent, args, context, info));
              }
            }
          });
        }
      });

      pool.schema = schema;
    }
    


    // check to init tables
    if (!cache.typesTableInit) {
      await services.accounts.rebaseTypes([...typeList]);
      cache.typesTableInit = true;
    }

    // setup it once
    // setup timer to clear expired tokens
    if (!timers.blacklist) {
      timers.blacklist = setInterval(() => {
        authentification.clearExpiredTokens();
      }, Math.min(jwt.accessTokenExpiresIn * 1000, TIMEOUT_MAX_INT));
    }

    return pool;
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
