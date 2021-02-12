import type { UserResolver } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';

const userResolver = new Proxy<UserResolver>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  name: () => ({}),
  phones: () => ({}),
  accounts: () => ({}),
  deleted: () => ({}),
  files: () => ({}),
  avatar: () => ({}),
}, {
  get: (target, prop: keyof UserResolver) => {
    const resolver: UserResolver[keyof UserResolver] = async (parent, _args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      try {
        const user = await dataloader.users.load(id);

        return user[prop];
      } catch ( err ) {
        throw new ServerError(
          `Failed to load user with id «${id}»`, { id, err },
        )
      }
    };

    return resolver;
  },
});

export default userResolver;
