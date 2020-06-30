
import { ServerError, BadRequestError, AuthService } from '@via-profit-services/core';
import { FileStorage } from '@via-profit-services/file-storage';

import { IResolverObject } from 'graphql-tools';
import createLoaders from '../loaders';
import AccountsService from '../service';
import {
  Context, IUpdateArgs, ICreateArgs, AccountStatus, SubscriptionTriggers,
} from '../types';

const accountsMutationResolver: IResolverObject<any, Context> = {
  update: async (parent, args: IUpdateArgs, context) => {
    const { id, input } = args;
    const { logger, pubsub } = context;
    const loaders = createLoaders(context);
    const accountsService = new AccountsService({ context });

    try {
      await accountsService.updateAccount(id, input);
    } catch (err) {
      throw new ServerError('Failed to update account', { input, id });
    }


    if (input.status === AccountStatus.forbidden) {
      // revoke all tokens of this account
      try {
        const authService = new AuthService({ context });
        authService.revokeAccountTokens(id);
      } catch (err) {
        logger.server.error('Failed to revoke account tokens', { err, id });
        throw new ServerError('Failed to revoke account tokens', { err });
      }
    }


    loaders.accounts.clear(id);

    const account = await loaders.accounts.load(id);
    pubsub.publish(SubscriptionTriggers.ACCOUNT_UPDATED, {
      accountWasUpdated: account,
    });


    return { id };
  },
  create: async (parent, args: ICreateArgs, context) => {
    const { input } = args;
    const accountsService = new AccountsService({ context });

    // check account exists by login
    const account = await accountsService.getAccountByLogin(input.login);
    if (account) {
      throw new BadRequestError(`Account with login ${input.login} already exists`, { input });
    }

    // create account
    try {
      const id = await accountsService.createAccount(input);

      return { id };
    } catch (err) {
      throw new ServerError('Failed to create account', { input });
    }
  },
  delete: async (parent, args: { id: string }, context) => {
    const { id } = args;
    const { logger, pubsub } = context;
    const accountsService = new AccountsService({ context });
    const loaders = createLoaders(context);
    const fileStorage = new FileStorage({ context });
    const authService = new AuthService({ context });

    // delete files
    try {
      fileStorage.deleteFilesByOwner(id);
    } catch (err) {
      logger.server.error('Failed to delete account files', { err, id });
      throw new ServerError('Failed to delete account files', { err });
    }

    // revoke all tokens of this account
    try {
      authService.revokeAccountTokens(id);
    } catch (err) {
      logger.server.error('Failed to revoke account tokens', { err, id });
      throw new ServerError('Failed to revoke account tokens', { err });
    }

    // delete account
    try {
      await accountsService.deleteAccount(id);
      loaders.accounts.clear(id);

      pubsub.publish(SubscriptionTriggers.ACCOUNT_DELETED, {
        accountWasDeleted: [id],
      });

      return true;
    } catch (err) {
      throw new ServerError(`Failed to delete account with id ${id}`, { id });
    }
  },
};

export default accountsMutationResolver;
