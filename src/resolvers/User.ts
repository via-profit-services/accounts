import type { UserResolver } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';
import { ImageTransform } from '@via-profit-services/file-storage';

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
    const resolver: UserResolver[keyof UserResolver] = async (parent, args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      try {
        const user = await dataloader.users.load(id);

        if (prop === 'avatar' && user.avatar) {
          const avatar = await dataloader.files.load(user.avatar.id);

          const transform: ImageTransform | null = avatar.metaData?.transform || args.transform
          ? {
            ...avatar.metaData?.transform || {},
            ...args.transform,
          }
          : null;

          return {
            ...user.avatar,
            transform,
          };
        }

        if (prop === 'files' && user.files) {
          return {
            ...user.files,
            transform: args.transform || null,
          };
        }

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
