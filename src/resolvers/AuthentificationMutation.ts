import { Resolvers } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';

const authentificationMutation: Resolvers['AuthentificationMutation'] = {
  create: async (_parent, args, context) => {
    const { login, password } = args;
    const { logger, services, emitter } = context;
    const { authentification } = services;
    const account = await services.accounts.getAccountByCredentials(login, password);

    if (!account) {
      logger.auth.debug(
        `Authorization attempt with login «${login}» failed. Invalid login or password`,
      );

      return {
        name: 'UnauthorizedError',
        msg: 'Invalid login or password',
        __typename: 'TokenRegistrationError',
      };
    }

    if (account.status === 'forbidden') {
      logger.auth.debug(
        `Authorization attempt with login «${login}» failed. Account locked`,
      );

      return {
        name: 'UnauthorizedError',
        msg: 'Account locked',
        __typename: 'TokenRegistrationError',
      };
    }

    logger.auth.debug(`Authorization attempt with login «${login}» success`);

    try {
      const tokenBag = await authentification.registerTokens({ uuid: account.id });

      emitter.emit('authentification-success', tokenBag);

      return {
        ...tokenBag,
        __typename: 'TokenBag',
      }
    } catch (err) {
      throw new ServerError('Failed to register tokens', { err });
    }
  },

  /**
   * Revoke Access token
   */
  revoke: async (parent, args, context) => {
    const { services } = context;
    const { accountID, tokenID } = args;
    const { authentification } = services;

    if (accountID) {
      try {
        await authentification.revokeAccountTokens(accountID);
      } catch (err) {
        throw new ServerError('Failed to revoke account tokens', { err });
      }
    }

    if (tokenID) {
      try {
        await authentification.revokeToken(tokenID);
      } catch (err) {
         throw new ServerError('Failed to revoke token', { err });
      }
    }

    return true;
  },
};

export default authentificationMutation;

