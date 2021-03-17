import { AccountStatus, Account, Resolvers } from '@via-profit-services/accounts';
import { ServerError, buildCursorConnection, buildQueryFilter, CursorConnection, BadRequestError } from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

export const accountsQueryResolver: Resolvers['AccountsQuery'] = {
  list: async (_parent, args, context): Promise<CursorConnection<Account>> => {
    const { dataloader, services } = context;
    const filter = buildQueryFilter(args);

    try {
      filter.where.push(
        ['deleted', '=', false], // exclude deleted accounts
      );
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
  me: async (_parent, _args, context) => {
    const { token } = context;
    if (token.uuid === ACCESS_TOKEN_EMPTY_UUID) {
      throw new BadRequestError('You should provide a valid access token for this operation');
    }

    return {
      id: token.uuid
    };
  },
  account: (_parent, args) => args,
  checkLoginExists: async (_parent, args, context): Promise<boolean> => {
    const { login, skipId } = args;
    const { services } = context;
    const result = await services.accounts.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
