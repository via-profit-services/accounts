import type { IObjectTypeResolver, IFieldResolver } from '@graphql-tools/utils';
import type { MyAccount } from '@via-profit-services/accounts';
import type { Context } from '@via-profit-services/core';
import { ServerError } from '@via-profit-services/core';

interface Parent {
  id: string;
}
const MyAccountResolver = new Proxy<IObjectTypeResolver<Parent, Context>>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
}, {
  get: (_target, prop: keyof MyAccount) => {
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

export default MyAccountResolver;
