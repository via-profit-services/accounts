import type { AccountsMiddlewareFactory, JwtConfig, AccessTokenPayload, RefreshTokenPayload } from '@via-profit-services/accounts';
import { Middleware, ServerError } from '@via-profit-services/core';
import { Privileges, PermissionsResolverObject } from '@via-profit-services/permissions';
import fs from 'fs';
import '@via-profit-services/sms';

import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  REDIS_TOKENS_BLACKLIST,
  TIMEOUT_MAX_INT,
  AUTHORIZED_PRIVILEGE,
  DEFAULT_PERMISSIONS,
} from './constants';
import contextMiddleware from './context-middleware';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';
import UnauthorizedError from './UnauthorizedError';


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
  };

  interface Cache {
    privilegesMap: Record<string, Privileges>;
    permissions: Record<string, PermissionsResolverObject>;
    initialPrivileges: Privileges;
    typesTableInit: boolean;
  }

  const cache: Cache = {
    privilegesMap: null,
    permissions: null,
    initialPrivileges: null,
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

    if (typeof context.services.permissions === 'undefined') {
      throw new ServerError(
        '«@via-profit-services/permissions is missing. If permissions middleware is already connected, make sure that the connection order is correct: permissions middleware must be connected before',
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

    // check to init tables
    if (!cache.typesTableInit) {
      await services.accounts.rebaseTypes([...typeList]);
      cache.typesTableInit = true;
    }

    // cache passed privileges
    if (cache.initialPrivileges === null) {
      cache.initialPrivileges = [...services.permissions.privileges];
    }

    // put permissions into permissions middleware
    if (cache.permissions === null) {
      cache.permissions = await services.authentification.loadPermissions();

      const requirePrivileges = [...services.permissions.requirePrivileges];
      requirePrivileges.push('authorized');

      services.permissions.permissions = {
        // permissions to allow Mutation.authorized, ...etc
        ...DEFAULT_PERMISSIONS,

        // original permissions (introspection control, etc.)
        ...services.permissions.permissions,

        // permissions from database
        ...cache.permissions,
      };

      services.permissions.requirePrivileges = [...new Set(requirePrivileges)];
    }

    // load privileges map
    if (cache.privilegesMap === null) {
      cache.privilegesMap = await services.authentification.loadPrivileges();
    }

    // extract token
    pool.context.token = authentification.getDefaultTokenPayload();
    pool.extensions = {
      tokenPayload: pool.context.token,
    };

    // reset privileges
    services.permissions.privileges = [...cache.initialPrivileges];

    // setup it once
    // setup timer to clear expired tokens
    if (!timers.blacklist) {
      timers.blacklist = setInterval(() => {
        authentification.clearExpiredTokens();
      }, Math.min(jwt.accessTokenExpiresIn * 1000, TIMEOUT_MAX_INT));
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


      // extract token privileges
      const tokenPrivileges = context.token.roles.reduce<string[]>((prev, role) => {
        const list = cache.privilegesMap[role] || [];

        return prev.concat(list);
      }, [AUTHORIZED_PRIVILEGE]);

      // compose privileges to permissions middleware
      const privileges = tokenPrivileges.concat(services.permissions.privileges || []);

      // make array of unique privileges and provide it to middleware
      services.permissions.privileges = [...new Set(privileges)];
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
