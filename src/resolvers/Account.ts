import type { AccountResolver } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';


const accountResolver = new Proxy<AccountResolver>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
  deleted: () => ({}),
}, {
  get: (_target, prop: keyof AccountResolver) => {
    const resolver: AccountResolver[keyof AccountResolver] = async (parent, _args, context) => {
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
