import type { Resolvers, User } from '@via-profit-services/accounts';
import { BadRequestError, ServerError } from '@via-profit-services/core';


const usersMutationResolver: Resolvers['UsersMutation'] = {
  update: async (_parent, args, context) => {
    const { id, input } = args;
    const { phones, accounts, ...userInput } = input;
    const { dataloader, services, emitter } = context;

    const originalData = await dataloader.users.load(id);
    if (!originalData) {
      throw new BadRequestError('User not found');
    }

    userInput.id = id;

    try {
      await services.users.updateUser(id, userInput);
    } catch (err) {
      throw new ServerError('Failed to update user', { err });
    }

    // update accounts
    if (typeof accounts !== 'undefined') {
      try {
        await accounts.reduce(async (prev, account) => {
          await prev;
          await services.accounts.updateAccount(account.id, account);
          dataloader.accounts.clear(account.id);
          const updatedAccount = await dataloader.accounts.load(account.id);

          emitter.emit('account-was-updated', updatedAccount);
        }, Promise.resolve());
      } catch (err) {
        throw new ServerError('Failed to update accounts', { err });
      }
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
        throw new ServerError('Failed to update phones', { err });
      }
    }

    dataloader.users.clear(id);
    dataloader.users.clear(userInput.id);
    const user = await dataloader.users.load(userInput.id);
    emitter.emit('user-was-updated', user);

    return user;
  },
  create: async (_parent, args, context) => {
    const { input } = args;
    const { phones, accounts, ...userInput } = input;
    const { services, logger, emitter, dataloader } = context;

    const result = { id: '' };

    try {
      result.id = await services.users.createUser(userInput);
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


    // create accounts
    if (typeof accounts !== 'undefined') {
      try {
        await accounts.reduce(async (prev, account) => {
          await prev;
          await services.accounts.createAccount(account);
          const newAccount = dataloader.accounts.load(account.id);
          emitter.emit('account-was-created', newAccount);
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
      if (user.accounts && user.accounts.length) {
        const userAccountIDs = user.accounts.map((account) => account.id);
        await services.accounts.deleteAccounts(userAccountIDs);
        userAccountIDs.map((userAccountID) => {
          dataloader.accounts.clear(userAccountID);
          emitter.emit('account-was-deleted', userAccountID);
        });

      }
    } catch (err) {
      throw new ServerError(`Failed to delete accounts of user ${user.id}`, { err });
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
