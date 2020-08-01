import { IResolverObject, IFieldResolver } from 'graphql-tools';

import createDataloaders from '../loaders';
import { IAccount, Context } from '../types';

interface IParent {
  id: string;
}
type TAccountResolver = IResolverObject<IParent, Context>;

const accountResolver = new Proxy<TAccountResolver>({
  id: () => ({}),
  avatar: () => ({}),
  files: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  name: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
  deleted: () => ({}),
}, {
  get: (target, prop: keyof IAccount) => {
    const resolver: IFieldResolver<IParent, Context> = async (parent, args, context) => {
      const { id } = parent;
      const loaders = createDataloaders(context);
      const account = await loaders.accounts.load(id);

      if (prop === 'avatar' && account.avatar) {
        return {
          ...account.avatar,
          transform: args.transform || null,
        };
      }

      return account[prop];
    };
    return resolver;
  },
});

export default accountResolver;
