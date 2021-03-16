import type { AccessTokenPayload, RefreshTokenPayload, Resolvers, Account } from '@via-profit-services/accounts';
import { ServerError, BadRequestError } from '@via-profit-services/core';
import '@via-profit-services/sms';
import { parsePhoneNumberFromString, CountryCode, PhoneNumber } from 'libphonenumber-js';

import { RESET_PASSWORD_MESSAGE } from '../constants';
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

      context.token = tokenBag.accessToken.payload;

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
    const { services, emitter } = context;
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
        const revokedIDs = await authentification.revokeAccountTokens(accountID);
        revokedIDs.forEach((revokedID) => {
          emitter.emit('token-was-revoked', revokedID);
        });

      } catch (err) {
        throw new ServerError('Failed to revoke account tokens', { err });
      }
    }

    if (tokenID) {
      try {
        await authentification.revokeToken(tokenID);
        emitter.emit('token-was-revoked', tokenID);
      } catch (err) {
         throw new ServerError('Failed to revoke token', { err });
      }
    }

    return null;
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
  reset: async (_parent, args, context) => {
    const { login } = args;
    const { services, dataloader, logger } = context;

    // check the login exists
    let account: Account | false;
    try {
      account = await services.accounts.getAccountByLogin(login);
    } catch (err) {
      throw new ServerError('Failed to get account', { err });
    }

    if (!account) {
      return {
        name: 'AccountNotFound',
        msg: 'Account not found',
        __typename: 'ResetPasswordError',
      }
    }

    if (!account.recoveryPhones) {
      return {
        name: 'MissingRecoveryPhones',
        msg: 'Account has not recovery phone numbers',
        __typename: 'ResetPasswordError',
      }
    }

    // reset password
    const min = 12222;
    const max = 99999;
    const password = Math.floor( min + Math.random() * (max + 1 - min)).toString();
    const recoveryPhones = await Promise.all(
      account.recoveryPhones.map(({ id }) => dataloader.phones.load(id)),
    );

    if (!recoveryPhones) {
      throw new ServerError('Failed to load recovery phones');
    }

    const phones: PhoneNumber[] = recoveryPhones.map(({ number, country }) => {
      const phone = parsePhoneNumberFromString(number, country as CountryCode);

      return phone;
    }).filter((phone) => phone !== undefined);

    try {
      await services.sms.send({
        message: RESET_PASSWORD_MESSAGE.replace('{password}', password),
        phones: phones.map((phone) => phone.formatInternational()),
      });
    } catch (err) {
      throw new ServerError('Failed to send SMS');
    }

    // update account password second
    try {
      await services.accounts.updateAccount(account.id, { password });
    } catch (err) {
      throw new ServerError('Failed to update account data');
    }

    dataloader.accounts.clear(account.id);
    logger.auth.debug(`Reset password for account «${account.id}»`);

    return {
      msg: 'Password was reset successfully',
      phones: phones.map((phone) => {
        let counter = 4;
        const formattedPhone = phone.formatNational();

        return formattedPhone.split('').reverse().map((char, index) => {
          if (index === formattedPhone.length - 1) {
            return char;
          }

          if (counter > 0 && char.match(/[0-9]/)) {
            counter -= 1;

            return char;
          }

          return char.match(/[0-9]/) ? '*' : char;
        }).reverse().join('');

      }),
      __typename: 'ResetPasswordSuccess',
    };
  },
};

export default authentificationMutation;

