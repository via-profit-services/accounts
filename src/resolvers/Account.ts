import type { IObjectTypeResolver, IFieldResolver } from '@graphql-tools/utils';
import type { Account } from '@via-profit-services/accounts';
import type { Context } from '@via-profit-services/core';
import { ServerError } from '@via-profit-services/core';

interface Parent {
  id: string;
}
const accountResolver = new Proxy<IObjectTypeResolver<Parent, Context>>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
  deleted: () => ({}),
}, {
  get: (target, prop: keyof Account) => {
    const resolver: IFieldResolver<Parent, Context> = async (parent, args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      try {
        const account = await dataloader.accounts.load(id);

        return account[prop];
      } catch ( err ) {
        throw new ServerError(
          `Failed to load account with id «${id}»`, { id },
        )
      }
    };

    return resolver;
  },
});

export default accountResolver;
