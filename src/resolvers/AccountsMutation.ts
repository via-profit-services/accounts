import type { Resolvers } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';


const accountsMutationResolver: Resolvers['AccountsMutation'] = {
  update: async (_parent, args, context) => {
    const { id, input } = args;
    const { dataloader, services } = context;

    try {
      await services.accounts.updateAccount(id, input);
    } catch (err) {
      throw new ServerError('Failed to update account', { input, id });
    }


    if (input.status === 'forbidden') {
      // revoke all tokens of this account
      try {
        services.authentification.revokeAccountTokens(id);
      } catch (err) {
        throw new ServerError('Failed to revoke account tokens', { err });
      }
    }


    dataloader.accounts.clear(id);

    return { id };
  },
  create: async (_parent, args, context) => {
    const { input } = args;
    const { services, logger } = context;

    try {
      const id = await services.accounts.createAccount(input);
      logger.auth.debug(`New account was created with id «${id}»`);

      return { id };

    } catch (err) {
      throw new ServerError('Failed to create account', { input });
    }

  },
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
  // createToken: async (_parent, args, context): Promise<TokenRegistrationResponse> => {
  //   const { login, password } = args;
  //   const { logger, services, emitter } = context;
  //   const account = await services.accounts.getAccountByCredentials(login, password);

  //   if (!account) {
  //     logger.auth.debug(
  //       `Authorization attempt with login «${login}» failed. Invalid login or password`,
  //     );

  //     return {
  //       name: 'UnauthorizedError',
  //       msg: 'Invalid login or password',
  //       __typename: 'TokenRegistrationError',
  //     };
  //   }

  //   if (account.status === 'forbidden') {
  //     logger.auth.debug(
  //       `Authorization attempt with login «${login}» failed. Account locked`,
  //     );

  //     return {
  //       name: 'UnauthorizedError',
  //       msg: 'Account locked',
  //       __typename: 'TokenRegistrationError',
  //     };
  //   }

  //   logger.auth.debug(`Authorization attempt with login «${login}» success`);

  //   try {
  //     const tokenBag = await services.permissions.registerTokens({ uuid: account.id });
  //     emitter.emit('authentification-success', tokenBag);

  //     return {
  //       ...tokenBag,
  //       __typename: 'TokenBag',
  //     }
  //   } catch (err) {
  //     throw new ServerError('Failed to register tokens', { err });
  //   }
  // },
};

export default accountsMutationResolver;
