import type { AccessTokenPayload, RefreshTokenPayload, Resolvers } from '@via-profit-services/accounts';
import { ServerError, BadRequestError } from '@via-profit-services/core';

import UnauthorizedError from '../UnauthorizedError';

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

    try {
      const tokenBag = await authentification.registerTokens({ uuid: account.id });

      logger.auth.debug(`Authorization attempt with login «${login}» success`);
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

    if (
      (typeof accountID === 'undefined' && typeof tokenID === 'undefined')
      || typeof accountID !== 'undefined' && typeof tokenID !== 'undefined'
    ) {
      throw new BadRequestError('You must pass one of the arguments: «accountID» or «tokenID»');
    }

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
  refresh: async (parent, args, context) => {
    const { refreshToken } = args;
    const { services, logger, emitter } = context;
    const { authentification } = services;

    logger.auth.debug('Attempt to refresh token');

    let tokenPayload: RefreshTokenPayload | AccessTokenPayload;
    try {
      tokenPayload = await authentification.verifyToken(refreshToken);
    } catch (err) {
     throw new UnauthorizedError(err.message);
    }

    if (!authentification.isRefreshTokenPayload(tokenPayload)) {
      throw new UnauthorizedError(
        'This is token are not «Refresh» token type. You should provide «Refresh» token type',
      );
    }

    try {
      const tokenBag = await authentification.registerTokens({ uuid: tokenPayload.uuid });

      emitter.emit('refresh-token-success', tokenBag);

      return {
        ...tokenBag,
        __typename: 'TokenBag',
      }
    } catch (err) {
      throw new ServerError('Failed to register tokens', { err });
    }
  },
};

export default authentificationMutation;

