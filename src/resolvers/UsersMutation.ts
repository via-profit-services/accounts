import type { Resolvers } from '@via-profit-services/accounts';
import { BadRequestError, ServerError } from '@via-profit-services/core';


const usersMutationResolver: Resolvers['UsersMutation'] = {
  update: async (_parent, args, context) => {
    const { id, input } = args;
    const { dataloader, services } = context;

    const account = input.account
    ? { id: input.account }
    : undefined;

    // check for account exists
    if (account) {
      const accountData = await services.accounts.getAccount(account.id);
      if (!accountData) {
        throw new BadRequestError(`Account with id «${account.id}» not found`);
      }
    }

    try {
      await services.users.updateUser(id, {
        ...input,
        account,
      });
    } catch (err) {
      throw new ServerError('Failed to update user', { input, id });
    }

    dataloader.users.clear(id);

    return { id };
  },
  create: async (_parent, args, context) => {
    const { input } = args;
    const { services, logger } = context;

    const account = input.account
    ? { id: input.account }
    : undefined;

    // check for account exists
    if (account) {
      const accountData = await services.accounts.getAccount(account.id);
      if (!accountData) {
        throw new BadRequestError(`Account with id «${account.id}» not found`);
      }
    }

    try {

      const id = await services.users.createUser({
        ...input,
        account,
      });
      logger.auth.debug(`New user was created with id «${id}»`);

      return { id };

    } catch (err) {
      throw new ServerError('Failed to create user', { input });
    }

  },
};

export default usersMutationResolver;
