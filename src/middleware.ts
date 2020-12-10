import type { Configuration, AccountsMiddlewareFactory, JwtConfig, AccessTokenPayload } from '@via-profit-services/accounts';
import { Middleware, ServerError, GraphqlMiddleware, Context } from '@via-profit-services/core';
import fs from 'fs';

import AccountsService from './AccountsService';
import authLogger from './auth-logger';
import {
  DEFAULT_ACCESS_TOKEN_EXPIRED,
  DEFAULT_REFRESH_TOKEN_EXPIRED,
  DEFAULT_SIGNATURE_ALGORITHM,
  DEFAULT_SIGNATURE_ISSUER,
  ACCESS_TOKEN_EMPTY_ID,
  ACCESS_TOKEN_EMPTY_UUID,
  ACCESS_TOKEN_EMPTY_ISSUER,
} from './constants';
import dataloaderFacroty from './dataloaders';
import resolvers from './resolvers';
import typeDefs from './typeDefs';


const accountsMiddlewareFactory: AccountsMiddlewareFactory = (config) => {
  const { privateKey, publicKey, logDir } = config;
  const jwt: JwtConfig = {
    issuer: DEFAULT_SIGNATURE_ISSUER,
    algorithm: DEFAULT_SIGNATURE_ALGORITHM,
    accessTokenExpiresIn: DEFAULT_ACCESS_TOKEN_EXPIRED,
    refreshTokenExpiresIn: DEFAULT_REFRESH_TOKEN_EXPIRED,
    privateKey: typeof privateKey === 'string' ? fs.readFileSync(privateKey) : privateKey,
    publicKey: typeof publicKey === 'string' ? fs.readFileSync(publicKey) : publicKey,
  };
  const logger = authLogger({ logDir });

  const middleware: Middleware = (props) => {
    const { request } = props;

    logger.debug('Graphql Middleware initialize');

    const keys: Pick<Configuration, 'privateKey' | 'publicKey'> = {
      privateKey: '',
      publicKey: '',
    };

    try {
      keys.privateKey = typeof privateKey === 'string' ? fs.readFileSync(privateKey) : privateKey;
      keys.publicKey = typeof publicKey === 'string' ? fs.readFileSync(publicKey) : publicKey;
    } catch (err) {
      logger.debug('Failed to get private or/and public keys');
      throw new ServerError('Failed to get private or/and public keys', err);
    }

    let token: AccessTokenPayload = {
      type: 'access',
      id: ACCESS_TOKEN_EMPTY_ID,
      uuid: ACCESS_TOKEN_EMPTY_UUID,
      iss: ACCESS_TOKEN_EMPTY_ISSUER,
      roles: [],
      exp: 0,
    };

    const graphqlMiddleware: GraphqlMiddleware = async (resolve, parent, args, context, info) => {
      const composedContext: Context = {
        ...context,
        token,
        jwt,
        logger: {
          ...context.logger, // original loggers
          auth: logger, // append sql logger
        },
        dataloader: {
          ...context.dataloader, // original dataloaders
          ...dataloaderFacroty(context), // append account dataloaders
        },
      };

      const bearerToken = AccountsService.extractTokenFromRequest(request);
      if (bearerToken) {
        const accountsService = new AccountsService({ context: composedContext });
        const bearerTokenPayload = await accountsService.verifyToken(bearerToken);
        if (bearerTokenPayload) {
          token = bearerTokenPayload;
        } else {
          // console.log(info);
          // console.log('------')
          // console.log(info.operation.selectionSet);


          // if (info.returnType.toString() === 'AccountsMutation!') {
          //   // if (info) {

          //   // }
          // }
          // throw new UnauthorizedError('Invalid token');
        }
      }

      return await resolve(parent, args, composedContext, info);
    }

    return graphqlMiddleware;
  }

  return {
    middleware,
    resolvers,
    typeDefs,
  }
}

export default accountsMiddlewareFactory;
