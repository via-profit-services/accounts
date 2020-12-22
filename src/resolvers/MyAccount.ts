import type { MyAccountResolver } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';

import { ACCESS_TOKEN_EMPTY_UUID } from '../constants';

const MyAccount = new Proxy<MyAccountResolver>({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  status: () => ({}),
  login: () => ({}),
  password: () => ({}),
  roles: () => ({}),
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


      try {
        const account = await dataloader.accounts.load(token.uuid);

        return account[prop];
      } catch ( err ) {
        throw new ServerError(
          `Failed to load account with id «${token.uuid}»`, { id: token.uuid },
        )
      }
    };

    return resolver;
  },
});

export default MyAccount;
