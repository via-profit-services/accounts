import { AccountStatus, Account, Resolvers } from '@via-profit-services/accounts';
import { ServerError, buildCursorConnection, buildQueryFilter, CursorConnection } from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

export const accountsQueryResolver: Resolvers['AccountsQuery'] = {
  list: async (_parent, args, context): Promise<CursorConnection<Account>> => {
    const { dataloader, services } = context;
    const filter = buildQueryFilter(args);

    try {
      const accountsConnection = await services.accounts.getAccounts(filter, true);
      const connection = buildCursorConnection(accountsConnection, 'accounts');
      await dataloader.accounts.primeMany(accountsConnection.nodes);

      return connection;

    } catch (err) {
      console.error(err)
      throw new ServerError('Failed to get Accounts list', { err });
    }
  },
  statusesList: (): AccountStatus[] => ['allowed', 'forbidden'],
  me: async (_parent, _args, context) => {
    const { token, dataloader } = context;

    if (token.uuid === ACCESS_TOKEN_EMPTY_UUID) {
      return null;
    }

    const account = dataloader.accounts.load(token.uuid);

    return account;
  },
  account: async (_parent, args, context) => {
    const { id } = args;
    const { dataloader } = context;
    
    const account = dataloader.accounts.load(id);

    return account;
  },
  checkLoginExists: async (_parent, args, context): Promise<boolean> => {
    const { login, skipId } = args;
    const { services } = context;
    const result = await services.accounts.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
