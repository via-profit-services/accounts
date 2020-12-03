import { IObjectTypeResolver, IFieldResolver } from '@graphql-tools/utils';
import { Account } from '@via-profit-services/accounts';
import { Context } from '@via-profit-services/core';

import createDataloaders from '../loaders';

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
      const loaders = createDataloaders(context);
      const account = await loaders.accounts.load(id);

      return account[prop];
    };

    return resolver;
  },
});

export default accountResolver;
