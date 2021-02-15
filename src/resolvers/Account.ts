import type { AccountResolver, Account } from '@via-profit-services/accounts';
import { ServerError, BadRequestError } from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

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
      const { dataloader, token } = context;

      if (token.uuid === ACCESS_TOKEN_EMPTY_UUID) {
        throw new ServerError(
          'Service account can not be loaded in this field «me». Please provide a valid access token with your request',
          { uuid: token.uuid },
        );
      }

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
