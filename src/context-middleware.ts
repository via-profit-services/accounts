import type { JwtConfig } from '@via-profit-services/accounts';
import { MiddlewareProps, Context, collateForDataloader } from '@via-profit-services/core';
import DataLoader from 'dataloader';


import AccountsService from './AccountsService';
import authLogger from './auth-logger';
import {
  ACCESS_TOKEN_EMPTY_ID,
  ACCESS_TOKEN_EMPTY_UUID,
  ACCESS_TOKEN_EMPTY_ISSUER,
} from './constants';

interface Props {
  jwt: JwtConfig;
  context: Context;
  config: MiddlewareProps['config'];
}


const contextMiddleware = (props: Props): Context => {

  const { context, config, jwt } = props;
  const { logDir } = config;

  // Default token state
  context.token = {
    type: 'access',
    id: ACCESS_TOKEN_EMPTY_ID,
    uuid: ACCESS_TOKEN_EMPTY_UUID,
    iss: ACCESS_TOKEN_EMPTY_ISSUER,
    roles: [],
    exp: 0,
  };

  // JsonWebToken settings
  context.jwt = jwt;

  // Accounts Service
  context.services.accounts = new AccountsService({ context });

  // Authorization Logger
  context.logger.auth = authLogger({ logDir });

  // Accounts Dataloader
  context.dataloader.accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.accounts.getAccountsByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return context;
}

export default contextMiddleware;
