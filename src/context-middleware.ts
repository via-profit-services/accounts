import type { JwtConfig } from '@via-profit-services/accounts';
import { MiddlewareProps, Context, collateForDataloader } from '@via-profit-services/core';
import DataLoader from 'dataloader';


import authLogger from './auth-logger';
import AccountsService from './services/AccountsService';
import PermissionsService from './services/PermissionsService';
import UsersService from './services/UsersService';


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

  // Permissions Service
  context.services.permissions = new PermissionsService({ context });

  // Users Service
  context.services.users = new UsersService({ context });

  // Default token state
  context.token = context.services.permissions.getDefaultTokenPayload();

  // Authorization Logger
  context.logger.auth = authLogger({ logDir });

  // Accounts Dataloader
  context.dataloader.accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.accounts.getAccountsByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  // Users Dataloader
  context.dataloader.users = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.users.getUsersByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return context;
}

export default contextMiddleware;
