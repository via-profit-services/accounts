import type { JwtConfig, Configuration } from '@via-profit-services/accounts';
import { MiddlewareProps, Context, collateForDataloader } from '@via-profit-services/core';
import DataLoader from 'dataloader';

import authLogger from './auth-logger';
import AccountsService from './services/AccountsService';
import AuthentificationService from './services/AuthentificationService';

interface Props {
  jwt: JwtConfig;
  context: Context;
  configuration: Configuration;
  config: MiddlewareProps['config'];
}

const contextMiddleware = async (props: Props): Promise<Context> => {

  const { context, config, jwt, configuration } = props;
  const { entities } = configuration;
  const { logDir } = config;

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

  return context;
}

export default contextMiddleware;
