import { AccountStatus, Account, Resolvers } from '@via-profit-services/accounts';
import { ServerError, buildCursorConnection, buildQueryFilter, CursorConnection } from '@via-profit-services/core';

export const accountsQueryResolver: Resolvers['AccountsQuery'] = {
  list: async (_parent, args, context): Promise<CursorConnection<Account>> => {
    const { dataloader, services } = context;
    const filter = buildQueryFilter(args);

    try {
      filter.where.push(['deleted', '=', false]);
      const accountsConnection = await services.accounts.getAccounts(filter);
      const connection = buildCursorConnection(accountsConnection, 'accounts');

      // fill the cache
      accountsConnection.nodes.forEach((node) => {
        dataloader.accounts.clear(node.id).prime(node.id, node);
      });

      return connection;
    } catch (err) {
      console.error(err)
      throw new ServerError('Failed to get Accounts list', { err });
    }
  },
  statusesList: (): AccountStatus[] => ['allowed', 'forbidden'],
  me: () => ({}),
  account: (parent) => parent,
  checkLoginExists: async (_parent, args, context): Promise<boolean> => {
    const { login, skipId } = args;
    const { services } = context;
    const result = await services.accounts.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
