import type { Configuration, JwtConfig, AccessTokenPayload } from '@via-profit-services/accounts';
import type { Middleware } from '@via-profit-services/core';

import AccountsService from './AccountsService';
import authLogger from './auth-logger';
import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  ACCESS_TOKEN_EMPTY_ID,
  ACCESS_TOKEN_EMPTY_UUID,
} from './constants';
import loaders from './loaders';
import resolvers from './resolvers';
import typeDefs from './typeDefs';
import UnauthorizedError from './UnauthorizedError';

const accountsMiddlweare = (props: Configuration): Middleware => {
  const middleware: Middleware = {
    context: ({ context, config }) => {
      const { logDir } = config;
      const logger = authLogger({ logDir });
      const jwt: JwtConfig = {
        issuer: DEFAULT_SIGNATURE_ISSUER,
        algorithm: DEFAULT_SIGNATURE_ALGORITHM,
        accessTokenExpiresIn: DEFAULT_ACCESS_TOKEN_EXPIRED,
        refreshTokenExpiresIn: DEFAULT_REFRESH_TOKEN_EXPIRED,
        ...props,
      };

      const token: AccessTokenPayload = {
        type: 'access',
        id: ACCESS_TOKEN_EMPTY_ID,
        uuid: ACCESS_TOKEN_EMPTY_UUID,
        roles: [],
        exp: 0,
        iss: '',
      };

      return {
        ...context,
        token,
        jwt,
        logger: {
          ...context.logger, // original loggers
          auth: logger, // append sql logger
        },
      };
    },
  };

  return middleware;
}


export {
  typeDefs,
  resolvers,
  AccountsService,
  loaders,
  UnauthorizedError,
};

export default accountsMiddlweare;
