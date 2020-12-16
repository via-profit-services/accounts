import { IObjectTypeResolver } from '@graphql-tools/utils';
import { AccountStatus, CheckLoginExistsArgs, Account } from '@via-profit-services/accounts';
import {
  ServerError, buildCursorConnection, Context,
  buildQueryFilter, InputFilter, CursorConnection,
} from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

export const accountsQueryResolver: IObjectTypeResolver<any, Context> = {
  list: async (_parent, args: InputFilter, context): Promise<CursorConnection<Account>> => {
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
  me: (_parent, _args, context) => {
    const { token } = context;

    if (token.uuid === ACCESS_TOKEN_EMPTY_UUID) {
      throw new ServerError('Service account can not be loaded in this field «me»', { uuid: token.uuid });
    }

    return { id: token.uuid }
  },
  account: (parent: { id: string }) => parent,
  checkLoginExists: async (_parent, args: CheckLoginExistsArgs, context): Promise<boolean> => {
    const { login, skipId } = args;
    const { services } = context;
    const result = await services.accounts.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
