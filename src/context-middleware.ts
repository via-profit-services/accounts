import type { JwtConfig } from '@via-profit-services/accounts';
import { MiddlewareProps, Context, collateForDataloader } from '@via-profit-services/core';
import DataLoader from 'dataloader';


import AccountsService from './AccountsService';
import authLogger from './auth-logger';


interface Props {
  jwt: JwtConfig;
  context: Context;
  config: MiddlewareProps['config'];
}

const contextMiddleware = (props: Props): Context => {

  const { context, config, jwt } = props;
  const { logDir } = config;

  // JsonWebToken settings
  context.jwt = jwt;

  // Accounts Service
  context.services.accounts = new AccountsService({ context });

  // Default token state
  context.token = context.services.accounts.getDefaultTokenPayload();

  // Authorization Logger
  context.logger.auth = authLogger({ logDir });

  // Accounts Dataloader
  context.dataloader.accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.accounts.getAccountsByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  // Users Dataloader
  context.dataloader.users = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.accounts.getUsersByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return context;
}

export default contextMiddleware;
