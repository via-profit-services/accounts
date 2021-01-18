import type { AccountResolver, Account } from '@via-profit-services/accounts';
import { ServerError, BadRequestError } from '@via-profit-services/core';


const accountResolver = new Proxy<AccountResolver>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
  deleted: () => ({}),
  recoveryPhones: () => ({}),
  entity: () => ({}),
  type: () => ({}),
}, {
  get: (_target, prop: keyof AccountResolver) => {
    const resolver: AccountResolver[keyof AccountResolver] = async (parent, _args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      let account: Account;

      try {
        account = await dataloader.accounts.load(id);
      } catch ( err ) {
        throw new ServerError(
          `Failed to load account with id «${id}»`, { err },
        )
      }

      if (!account) {
        throw new BadRequestError(
          `Account with id «${id}» not found`, { id },
        )
      }

      if (prop === 'entity' && account.entity) {
        return {
          __typename: account.type,
          ...account.entity,
        }
      }

      return account[prop];
    };

    return resolver;
  },
});

export default accountResolver;
