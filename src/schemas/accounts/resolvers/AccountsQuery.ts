import {
  ServerError, UnauthorizedError, buildCursorConnection, buildQueryFilter, TInputFilter,
} from '@via-profit-services/core';
import { IResolverObject } from 'graphql-tools';

import { ROLES_LIST } from '../constants';
import createLoaders from '../loaders';
import AccountsService from '../service';
import { Context, AccountStatus, ICheckLoginExistsArgs } from '../types';


export const accountsQueryResolver: IResolverObject<any, Context> = {
  list: async (source, args: TInputFilter, context) => {
    const loaders = createLoaders(context);
    const filter = buildQueryFilter(args);
    const accountsService = new AccountsService({ context });

    try {
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
  statusesList: () => Object.values(AccountStatus),
  rolesList: () => ROLES_LIST,
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
  checkLoginExists: async (parent, args: ICheckLoginExistsArgs, context) => {
    const { login, skipId } = args;
    const accountsService = new AccountsService({ context });
    const result = await accountsService.checkLoginExists(login, skipId);

    return result;
  },
};

export default accountsQueryResolver;
