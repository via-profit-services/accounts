import { IObjectTypeResolver } from '@graphql-tools/utils';
import { UpdateArgs, CreateArgs } from '@via-profit-services/accounts';
import { ServerError, BadRequestError, Context } from '@via-profit-services/core';

import AccountsService from '../AccountsService';
import createLoaders from '../loaders';

interface GetTokenArgs {
  login: string;
  password: string;
}

const accountsMutationResolver: IObjectTypeResolver<any, Context> = {
  // update: async (parent, args: UpdateArgs, context) => {
  //   const { id, input } = args;
  //   const { logger, pubsub } = context;

  //   const loaders = createLoaders(context);
  //   const accountsService = new AccountsService({ context });

  //   try {
  //     await accountsService.updateAccount(id, input);
  //   } catch (err) {
  //     throw new ServerError('Failed to update account', { input, id });
  //   }


  //   if (input.status === 'forbidden') {
  //     // revoke all tokens of this account
  //     // try {
  //     //   const authService = new AuthService({ context });
  //     //   authService.revokeAccountTokens(id);
  //     // } catch (err) {
  //     //   logger.server.error('Failed to revoke account tokens', { err, id });
  //     //   throw new ServerError('Failed to revoke account tokens', { err });
  //     // }
  //   }


  //   loaders.accounts.clear(id);

  //   const account = await loaders.accounts.load(id);
  //   pubsub.publish('account-updated', {
  //     accountWasUpdated: account,
  //   });


  //   return { id };
  // },
  // create: async (parent, args: CreateArgs, context) => {
  //   const { input } = args;
  //   const accountsService = new AccountsService({ context });

  //   // check account exists by login
  //   const account = await accountsService.getAccountByLogin(input.login);
  //   if (account) {
  //     throw new BadRequestError(`Account with login ${input.login} already exists`, { input });
  //   }

  //   // create account
  //   try {
  //     const id = await accountsService.createAccount(input);

  //     return { id };
  //   } catch (err) {
  //     throw new ServerError('Failed to create account', { input });
  //   }
  // },
  // delete: async (parent, args: { id: string }, context) => {
  //   const { id } = args;
  //   const { logger, pubsub, token } = context;
  //   // context.
  //   const accountsService = new AccountsService({ context });
  //   const loaders = createLoaders(context);
  //   // const fileStorage = new FileStorage({ context });
  //   // const authService = new AuthService({ context });

  //   logger.server.debug(`Delete account ${id} request`, { initiator: token.uuid });

  //   // delete files
  //   try {
  //     logger.server.debug(`Delete account ${id} files request`, { initiator: token.uuid });
  //     // fileStorage.deleteFilesByOwner(id);
  //   } catch (err) {
  //     logger.server.error('Failed to delete account files', { err, id });
  //     throw new ServerError('Failed to delete account files', { err });
  //   }

  //   // revoke all tokens of this account
  //   try {
  //     logger.server.debug(`Revoke account ${id} tokens request`, { initiator: token.uuid });
  //     // authService.revokeAccountTokens(id);
  //   } catch (err) {
  //     logger.server.error('Failed to revoke account tokens', { err, id });
  //     throw new ServerError('Failed to revoke account tokens', { err });
  //   }

  //   // delete account
  //   try {
  //     await accountsService.deleteAccount(id);
  //     loaders.accounts.clear(id);

  //     pubsub.publish('account-deleted', {
  //       accountWasDeleted: [id],
  //     });

  //     return true;
  //   } catch (err) {
  //     throw new ServerError(`Failed to delete account with id ${id}`, { id });
  //   }
  // },
  getToken: async (parent: any, args: GetTokenArgs, context) => {
    const { login, password } = args;

    console.log({ login, password })

    return {
      result: false,
    };
  },
};

export default accountsMutationResolver;
