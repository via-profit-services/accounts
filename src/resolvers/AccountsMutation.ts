import type { Resolvers } from '@via-profit-services/accounts';
import { BadRequestError, ServerError } from '@via-profit-services/core';


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

    try {
      await services.accounts.updateAccount(id, accountInput);
    } catch (err) {
      throw new ServerError('Failed to update account', { err });
    }

    // update phones
    if (typeof recoveryPhones !== 'undefined') {
      try {
        await recoveryPhones.reduce(async (prev, phone) => {
          await prev;
          await services.phones.updatePhone(phone.id, phone);
          dataloader.phones.clear(phone.id);
        }, Promise.resolve());
      } catch (err) {
        throw new ServerError('Failed to update account', { err });
      }
    }

    if (accountInput.status === 'forbidden') {
      // revoke all tokens of this account
      try {
        services.authentification.revokeAccountTokens(id);
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
    const { services, logger } = context;
    const { recoveryPhones, ...accountInput } = input;

    const result = { id: '' };

    try {
      const id = await services.accounts.createAccount(accountInput);
      logger.auth.debug(`New account was created with id «${id}»`);

     result.id = id;

    } catch (err) {
      throw new ServerError('Failed to create account', { err });
    }

    // create phones
    if (typeof recoveryPhones !== 'undefined') {
      try {
        await recoveryPhones.reduce(async (prev, phone) => {
          await prev;
          await services.phones.createPhone(phone);
        }, Promise.resolve());
      } catch (err) {
        throw new ServerError('Failed to create account phones', { err });
      }
    }

    return result;
  },
  delete: async (_parent, args, context) => {
    const { id } = args;
    const { logger, token, services, emitter, dataloader } = context;

    logger.server.debug(`Delete account ${id} request`, { initiator: token.uuid });

    // revoke all tokens of this account
    try {
      services.authentification.revokeAccountTokens(id);
      logger.server.debug(`Revoke account ${id} tokens request`, { initiator: token.uuid });
    } catch (err) {
      throw new ServerError('Failed to revoke account tokens', { err });
    }

    // delete account
    try {
      await services.accounts.deleteAccount(id);
      dataloader.accounts.clear(id);

      emitter.emit('account-was-deleted', id);

      return true;
    } catch (err) {
      throw new ServerError(`Failed to delete account ${id}`, { id });
    }

  },
};

export default accountsMutationResolver;
