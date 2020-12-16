import type { IObjectTypeResolver, IFieldResolver } from '@graphql-tools/utils';
import type { User } from '@via-profit-services/accounts';
import type { Context } from '@via-profit-services/core';
import { ServerError } from '@via-profit-services/core';

interface Parent {
  id: string;
}
const userResolver = new Proxy<IObjectTypeResolver<Parent, Context>>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  name: () => ({}),
  phones: () => ({}),
  deleted: () => ({}),
}, {
  get: (target, prop: keyof User) => {
    const resolver: IFieldResolver<Parent, Context> = async (parent, args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      try {
        const user = await dataloader.users.load(id);

        return user[prop];
      } catch ( err ) {
        throw new ServerError(
          `Failed to load user with id «${id}»`, { id },
        )
      }
    };

    return resolver;
  },
});

export default userResolver;
