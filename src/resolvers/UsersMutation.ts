import type { Resolvers, DeleteUserResult } from '@via-profit-services/accounts';
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
      dataloader.users.clear(id);
      dataloader.users.clear(userInput.id);
    } catch (err) {
      throw new ServerError('Failed to update user', { err });
    }

    // update accounts
    if (typeof accounts !== 'undefined') {
      await accounts.reduce(async (prev, account) => {
        await prev;

        if (typeof account.login !== 'undefined') {
          const { login, id } = account;
          const isLoginExists = await services.accounts.checkLoginExists(login, id);
          if (isLoginExists) {
            throw new BadRequestError(`An account with login «${login}» already exists`);
          }
        }

        try {
          await services.accounts.updateAccount(account.id, account);
          dataloader.accounts.clear(account.id)

        } catch (err) {
          throw new ServerError('Failed to update account', { err });
        }

        const updatedAccount = await dataloader.accounts.load(account.id);

        emitter.emit('account-was-updated', updatedAccount);
      }, Promise.resolve());

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
            entity: userInput.id,
            type: 'User',
          });

          dataloader.phones.clear(phone.id);

          // create new phone
        } else {

          const phoneID = await services.phones.createPhone({
            ...phone,
            type: 'User',
            entity: userInput.id,
          });
          dataloader.phones.clear(phoneID);
        }

      }, Promise.resolve());
    }

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
      dataloader.users.clear(result.id);
      logger.auth.debug(`New user was created with id «${result.id}»`);

    } catch (err) {
      throw new ServerError('Failed to create user', { err });
    }


    // create accounts
    if (typeof accounts !== 'undefined') {

      await accounts.reduce(async (prev, account) => {
        await prev;

        // check to login unique
        const isLoginExists = await services.accounts.checkLoginExists(account.login);
        if (isLoginExists) {
          await services.users.deleteUser(result.id);
          dataloader.users.clear(result.id);
          throw new BadRequestError(`An account with login «${account.login}» already exists`);
        }

        // create account
        try {
          const newAccountID = await services.accounts.createAccount({
            ...account,
            entity: result.id,
            type: 'User',
          });

          const newAccount = await dataloader.accounts.clear(newAccountID).load(newAccountID);
          emitter.emit('account-was-created', newAccount);
        } catch (err) {

          await services.users.deleteUser(result.id);
          dataloader.users.clear(result.id);
          throw new ServerError('Failed to create user accounts', { err });
        }
      }, Promise.resolve());
    }

    // create phones
    if (typeof phones !== 'undefined') {
      try {
        await phones.reduce(async (prev, phone) => {
          await prev;
          const phoneID = await services.phones.createPhone({
            ...phone,
            entity: result.id,
            type: 'User',
          });
          dataloader.phones.clear(phoneID);
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
    const { id, ids, dropAccount } = args;
    const { logger, token, services, emitter, dataloader } = context;
    const deletedUsers: string[] = [].concat(ids || []).concat(id ? [id] : []);
    const deletedAccounts: string[] = [];

    // delete users
    await services.users.deleteUsers(deletedUsers);
    deletedUsers.forEach((idToDelete) => {
      dataloader.clients.clear(idToDelete);
      emitter.emit('user-was-deleted', idToDelete);
      logger.server.debug(`Delete user ${idToDelete} request`, { initiator: token.uuid });
    });

    // delete user files
    await services.files.deleteFilesByOwner(deletedUsers);

    // delete accounts
    if (dropAccount) {
      const accounts = await services.accounts.getAccounts({
        limit: Number.MAX_SAFE_INTEGER,
        where: [
          ['entity', 'in', deletedUsers],
          ['deleted', '=', false],
        ],
      });

      if (accounts.totalCount) {
        const userAccountIDs = accounts.nodes.map(({ id }) => id);
        await services.accounts.deleteAccounts(userAccountIDs);

        userAccountIDs.map((userAccountID) => {
          deletedAccounts.push(userAccountID);
          dataloader.accounts.clear(userAccountID);
          emitter.emit('account-was-deleted', userAccountID);
        });
      }
    }

    const response: DeleteUserResult = {
      deletedAccounts,
      deletedUsers,
    };

    return response;
  },
};

export default usersMutationResolver;
