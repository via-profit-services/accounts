import type { Resolvers, User } from '@via-profit-services/accounts';
import { BadRequestError, ServerError } from '@via-profit-services/core';


const usersMutationResolver: Resolvers['UsersMutation'] = {
  update: async (_parent, args, context) => {
    const { id, input } = args;
    const { phones, ...userInput } = input;
    const { dataloader, services, emitter } = context;

    // check phones IDs
    if (typeof phones !== 'undefined') {
      phones.map((phone) => {
        if (typeof phone.id === 'undefined') {
          throw new BadRequestError('You must pass the Phone id to update it');
        }
      });
    }

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
        ...userInput,
        account,
      });
    } catch (err) {
      throw new ServerError('Failed to update user', { err });
    }

    // update phones
    if (typeof phones !== 'undefined') {
      try {
        await phones.reduce(async (prev, phone) => {
          await prev;
          await services.phones.updatePhone(phone.id, phone);
          dataloader.phones.clear(phone.id);
        }, Promise.resolve());
      } catch (err) {
        throw new ServerError('Failed to update account', { err });
      }
    }

    dataloader.users.clear(id);
    const user = await dataloader.users.load(id);
    emitter.emit('user-was-updated', user);

    return user;
  },
  create: async (_parent, args, context) => {
    const { input } = args;
    const { phones, ...userInput } = input;
    const { services, logger, emitter, dataloader } = context;

    const account = userInput.account
    ? { id: input.account }
    : undefined;

    // check for account exists
    if (account) {
      const accountData = await services.accounts.getAccount(account.id);
      if (!accountData) {
        throw new BadRequestError(`Account with id «${account.id}» not found`);
      }
    }

    const result = { id: '' };

    try {

      result.id = await services.users.createUser({
        ...input,
        account,
      });
      logger.auth.debug(`New user was created with id «${result.id}»`);

    } catch (err) {
      throw new ServerError('Failed to create user', { input });
    }


    // create phones
    if (typeof phones !== 'undefined') {
      try {
        await phones.reduce(async (prev, phone) => {
          await prev;
          await services.phones.createPhone(phone);
        }, Promise.resolve());
      } catch (err) {
        throw new ServerError('Failed to create user phones', { err });
      }
    }

    const user = await dataloader.users.load(result.id);
    emitter.emit('user-was-created', user);

    return user;
  },
  delete: async (_parent, args, context) => {
    const { id } = args;
    const { logger, token, services, emitter, dataloader } = context;

    logger.server.debug(`Delete user ${id} request`, { initiator: token.uuid });

    let user: User;
    try {
      user = await dataloader.users.load(id);
    } catch (err) {
      throw new ServerError(`Failed to load user ${id}`, { err });
    }

    // delete account first
    try {
      if (user.account) {
        await services.accounts.deleteAccount(user.account.id);
        dataloader.users.clear(user.account.id);
        emitter.emit('account-was-deleted', user.account.id);
      }
    } catch (err) {
      throw new ServerError(`Failed to delete account ${user.account.id}`, { err });
    }

    // delete user first
    try {
      await services.users.deleteUser(id);
      emitter.emit('user-was-deleted', id);
    } catch (err) {
      throw new ServerError(`Failed to delete user ${id}`, { err });
    }

    return true;

  },
};

export default usersMutationResolver;
