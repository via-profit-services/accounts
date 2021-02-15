import type { User, Resolvers } from '@via-profit-services/accounts';
import { ServerError, buildCursorConnection, buildQueryFilter, CursorConnection } from '@via-profit-services/core';


export const UsersQueryResolver: Resolvers['UsersQuery'] = {
  list: async (_source, args, context): Promise<CursorConnection<User>> => {
    const { dataloader, services } = context;
    const filter = buildQueryFilter(args);

    try {
      filter.where.push(
        ['deleted', '=', false], // exclude deleted users
      );
      const usersConnection = await services.users.getUsers(filter);
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
  user: async (_source, args, context): Promise<User> => {
    const { id } = args;
    const { dataloader } = context;
    const user = await dataloader.users.load(id);

    return user;
  },
};

export default UsersQueryResolver;
