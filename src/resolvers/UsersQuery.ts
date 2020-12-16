import { IObjectTypeResolver } from '@graphql-tools/utils';
import type { User } from '@via-profit-services/accounts';

import {
  ServerError, buildCursorConnection, Context,
  buildQueryFilter, InputFilter, CursorConnection,
} from '@via-profit-services/core';


export const UsersQueryResolver: IObjectTypeResolver<any, Context> = {
  list: async (_source, args: InputFilter, context): Promise<CursorConnection<User>> => {
    const { dataloader, services } = context;
    const filter = buildQueryFilter(args);

    try {
      filter.where.push(['deleted', '=', false]);
      const usersConnection = await services.accounts.getUsers(filter);
      const connection = buildCursorConnection(usersConnection, 'users');

      // fill the cache
      usersConnection.nodes.forEach((node) => {
        dataloader.users.clear(node.id).prime(node.id, node);
      });

      return connection;
    } catch (err) {
      console.error(err)
      throw new ServerError('Failed to get Users list', { err });
    }
  },
  user: async (parent, args: {id: string}, context): Promise<User> => {
    const { id } = args;
    const { dataloader } = context;
    const user = await dataloader.users.load(id);

    return user;
  },
};

export default UsersQueryResolver;
