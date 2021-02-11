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
    if (phones) {
      const allClientPhones = await services.phones.getPhonesByEntities([id, userInput.id]);

      // delete old phones
      await allClientPhones.nodes.reduce(async (prev, phone) => {
        await prev;

        if (!phones.find((p) => p.id === phone.id)) {
          await services.phones.deletePhones([phone.id]);
          dataloader.phones.clear(phone.id);
        }
      }, Promise.resolve())

      // check and create/update new phones
      await phones.reduce(async (prev, phone) => {
        await prev;

        if (!phone.id) {
          throw new BadRequestError('Phone number must be contain ID');
        }

        // try to load phone
        const existsPhone = await dataloader.phones.load(phone.id);

        // Clearing!, since the dataloader remembered this phone as not existing
        dataloader.phones.clear(phone.id);

        // update phone
        if (existsPhone) {

          if (existsPhone.entity.id !== userInput.id) {
            throw new BadRequestError('This phone number belongs to another entity');
          }

          await services.phones.updatePhone(phone.id, {
            ...phone,
            type: 'User',
          });

          dataloader.phones.clear(phone.id);

          // create new phone
        } else {

          await services.phones.createPhone({
            ...phone,
            type: 'User',
            entity: {
              id: userInput.id,
            },
          });
        }

      }, Promise.resolve());
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
