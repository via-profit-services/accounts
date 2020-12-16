import { IObjectTypeResolver } from '@graphql-tools/utils';
import { AccountStatus, CheckLoginExistsArgs } from '@via-profit-services/accounts';
import {
  ServerError, buildCursorConnection, Context,
  buildQueryFilter, InputFilter,
} from '@via-profit-services/core';

import UnauthorizedError from '../UnauthorizedError';

export const accountsQueryResolver: IObjectTypeResolver<any, Context> = {
  list: async (source, args: InputFilter, context) => {
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
  // rolesList: () => ROLES_LIST,
  me: async (parent, args, context) => {

    if (context.token.uuid === '') {
      throw new UnauthorizedError('Unknown account');
    }
    const { dataloader } = context;
    const account = await dataloader.accounts.load(context.token.uuid);

    return account;
  },
  account: async (parent, args: {id: string}, context) => {
    const { id } = args;
    const { dataloader } = context;
    const account = await dataloader.accounts.load(id);

    return account;
  },
  checkLoginExists: async (parent, args: CheckLoginExistsArgs, context) => {
    const { login, skipId } = args;
    const { services } = context;
    const result = await services.accounts.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
