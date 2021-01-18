import type { MyAccountResolver, MyAccount } from '@via-profit-services/accounts';
import { ServerError, BadRequestError } from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

const myAccountResolver = new Proxy<MyAccountResolver>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
  recoveryPhones: () => ({}),
  entity: () => ({}),
  type: () => ({}),
}, {
  get: (_target, prop: keyof MyAccountResolver) => {
    const resolver: MyAccountResolver[keyof MyAccountResolver] = async (parent, _args, context) => {
      const { token } = context;
      const { dataloader } = context;

      if (token.uuid === ACCESS_TOKEN_EMPTY_UUID) {
        throw new ServerError(
          'Service account can not be loaded in this field «me». Please provide a valid access token with your request',
          { uuid: token.uuid },
        );
      }

      let account: MyAccount;
      try {
        account = await dataloader.accounts.load(token.uuid);

      } catch ( err ) {
        throw new ServerError(
          `Failed to load account with id «${token.uuid}»`, { err },
        );
      }

      if (!account) {
        throw new BadRequestError(
          `Account with id «${token.uuid}» not found`, { id: token.uuid },
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

export default myAccountResolver;
