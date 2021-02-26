import type { Resolvers, DeleteAccountResult } from '@via-profit-services/accounts';
import { BadRequestError, ServerError } from '@via-profit-services/core';
import { v4 as uuidv4 } from 'uuid';

const accountsMutationResolver: Resolvers['AccountsMutation'] = {
  update: async (_parent, args, context) => {
    const { id, input } = args;
    const { recoveryPhones, ...accountInput } = input;
    const { dataloader, services, emitter } = context;

    // check to passed login and password if one of this fields will be updated
    if (typeof accountInput.login !== 'undefined' && typeof accountInput.password === 'undefined') {
      throw new BadRequestError('For login update you should provide the password');
    }

    if (typeof accountInput.password !== 'undefined' && typeof accountInput.login === 'undefined') {
      throw new BadRequestError('For password update you should provide your login');
    }

    accountInput.id = id;

    // check to account login is unique
    if (typeof accountInput.login !== 'undefined') {
      const isLoginExists = await services.accounts.checkLoginExists(accountInput.login, id);
      if (isLoginExists) {
        throw new BadRequestError(`An account with login «${accountInput.login}» already exists`);
      }
    }

    try {
      await services.accounts.updateAccount(id, accountInput);
      dataloader.accounts.clear(accountInput.id);
    } catch (err) {
      throw new ServerError('Failed to update account', { err });
    }

    if (recoveryPhones) {
      await services.phones.replacePhones(accountInput.id, recoveryPhones.map((phone) => ({
        ...phone,
        id: phone.id || uuidv4(),
        type: 'Account',
      })));
    }

    if (accountInput.status === 'forbidden') {
      // revoke all tokens of this account
      try {
        const revokedIDs = await services.authentification.revokeAccountTokens(id);
        revokedIDs.forEach((revokedID) => {
          emitter.emit('token-was-revoked', revokedID);
        });
      } catch (err) {
        throw new ServerError('Failed to revoke account tokens', { err });
      }
    }


    dataloader.accounts.clear(id);
    const account = await dataloader.accounts.load(id);
    emitter.emit('account-was-updated', account);


    return account;
  },
  create: async (_parent, args, context) => {
    const { input } = args;
    const { services, logger, dataloader } = context;
    const { recoveryPhones, ...accountInput } = input;

    const result = { id: '' };

    try {
      const isLoginExists = await services.accounts.checkLoginExists(accountInput.login);
      if (isLoginExists) {
        throw new BadRequestError(`An account with login «${accountInput.login}» already exists`);
      }
    } catch (err) {
      throw new ServerError('Failed to check account login', { err });
    }

    try {
      const id = await services.accounts.createAccount(accountInput);

      dataloader.accounts.clear(id);
      logger.auth.debug(`New account was created with id «${id}»`);

     result.id = id;

    } catch (err) {
      throw new ServerError('Failed to create account', { err });
    }

    // create phones
    if (typeof recoveryPhones !== 'undefined') {
      await services.phones.replacePhones(result.id, recoveryPhones.map((phone) => ({
        ...phone,
        id: phone.id || uuidv4(),
        type: 'Account',
      })));
    }

    dataloader.accounts.clear(result.id);

    return result;
  },
  delete: async (_parent, args, context) => {
    const { id, ids } = args;
    const { logger, token, services, emitter, dataloader } = context;

    const deleted: string[] = [].concat(ids || []).concat(id ? [id] : []);


    // revoke all tokens of this account
    await deleted.reduce(async (prev, idToDelete) => {
      await prev;

      logger.server.debug(`Delete account ${idToDelete} request`, { initiator: token.uuid });

      try {
        logger.server.debug(`Revoke account ${idToDelete} tokens request`, { initiator: token.uuid });
        const revokedTokenIDs = await services.authentification.revokeAccountTokens(idToDelete);
        revokedTokenIDs.forEach((revokedID) => {
          emitter.emit('token-was-revoked', revokedID);
        });
      } catch (err) {
        throw new ServerError('Failed to revoke account tokens', { err });
      }

      // delete account
      try {
        await services.accounts.deleteAccount(idToDelete);
        dataloader.accounts.clear(idToDelete);

        emitter.emit('account-was-deleted', idToDelete);

      } catch (err) {
        throw new ServerError(`Failed to delete account ${idToDelete}`, { err });
      }

    }, Promise.resolve());

    const response: DeleteAccountResult = {
      deletedAccounts: deleted,
    };

    return response;
  },
};

export default accountsMutationResolver;
