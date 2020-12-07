import { IObjectTypeResolver } from '@graphql-tools/utils';
import { AccountStatus, CheckLoginExistsArgs } from '@via-profit-services/accounts';
import {
  ServerError, buildCursorConnection, Context,
  buildQueryFilter, InputFilter,
} from '@via-profit-services/core';

import AccountsService from '../AccountsService';
import createLoaders from '../loaders';
import UnauthorizedError from '../UnauthorizedError';

export const accountsQueryResolver: IObjectTypeResolver<any, Context> = {
  list: async (source, args: InputFilter, context) => {
    const loaders = createLoaders(context);
    const filter = buildQueryFilter(args);
    const accountsService = new AccountsService({ context });

    try {
      filter.where.push(['deleted', '=', false]);
      const accountsConnection = await accountsService.getAccounts(filter);
      const connection = buildCursorConnection(accountsConnection, 'accounts');

      // fill the cache
      accountsConnection.nodes.forEach((node) => {
        loaders.accounts.clear(node.id).prime(node.id, node);
      });

      return connection;
    } catch (err) {
      throw new ServerError('Failed to get Accounts list', { err });
    }
  },
  statusesList: (): AccountStatus[] => ['allowed', 'forbidden'],
  // rolesList: () => ROLES_LIST,
  me: async (parent, args, context) => {

    if (context.token.uuid === '') {
      throw new UnauthorizedError('Unknown account');
    }
    const loaders = createLoaders(context);
    const account = await loaders.accounts.load(context.token.uuid);

    return account;
  },
  account: async (parent, args: {id: string}, context) => {
    const { id } = args;
    const loaders = createLoaders(context);
    const account = await loaders.accounts.load(id);

    return account;
  },
  checkLoginExists: async (parent, args: CheckLoginExistsArgs, context) => {
    const { login, skipId } = args;
    const accountsService = new AccountsService({ context });
    const result = await accountsService.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
