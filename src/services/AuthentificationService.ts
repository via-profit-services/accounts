import type {
  PermissionsServiceProps,
  AccessTokenPayload,
  TokenPackage,
  AuthentificationService as AuthentificationServiceInterface,
} from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';
import bcryptjs from 'bcryptjs';
import { IncomingMessage } from 'http';
import jsonwebtoken from 'jsonwebtoken';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import {
  TOKEN_BEARER_KEY,
  TOKEN_BEARER,
  REDIS_TOKENS_BLACKLIST,
  ACCESS_TOKEN_EMPTY_ID,
  ACCESS_TOKEN_EMPTY_UUID,
  ACCESS_TOKEN_EMPTY_ISSUER,
} from '../constants';
import UnauthorizedError from '../UnauthorizedError';

class AuthentificationService implements AuthentificationServiceInterface {
  props: PermissionsServiceProps;

  public constructor(props: PermissionsServiceProps) {
    this.props = props;
  }

  public async clearExpiredTokens() {
    const { context } = this.props;
    const { knex, redis } = context;

    const tokensList = await knex('tokens')
      .select('id')
      .where('expiredAt', '<', knex.raw('now()'));

    const expiredIds = tokensList.map((data: {id: string}) => data.id);

    if (expiredIds.length) {
      try {
        await redis.srem(REDIS_TOKENS_BLACKLIST, expiredIds);
      } catch (err) {
        throw new ServerError('Failed to remove data from BlackList', { err });
      }
    }

    await knex('tokens')
      .del()
      .where('expiredAt', '<', knex.raw('now()'));
  }

  public getDefaultTokenPayload(): AccessTokenPayload {
    return {
      type: 'access',
      id: ACCESS_TOKEN_EMPTY_ID,
      uuid: ACCESS_TOKEN_EMPTY_UUID,
      iss: ACCESS_TOKEN_EMPTY_ISSUER,
      roles: [],
      exp: 0,
    };
  }

  /**
   * Just crypt password
   */
  public cryptUserPassword(password: string) {
    const salt = bcryptjs.genSaltSync(10);

    return bcryptjs.hashSync(password, salt);
  }


  /**
   * Generate token pair (access + refresh)
   */
  public generateTokens(
    payload: {
      uuid: string;
      roles: string[];
    },
    exp?: {
      access: number;
      refresh: number;
    },
  ): TokenPackage {
    const { context } = this.props;
    const {
      accessTokenExpiresIn, refreshTokenExpiresIn, issuer,
      algorithm, privateKey,
    } = context.jwt;

    const accessExpires = exp?.access ?? accessTokenExpiresIn;
    const refreshExpires = exp?.refresh ?? refreshTokenExpiresIn;

    const accessTokenPayload = {
      ...payload,
      type: 'access',
      id: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + Number(accessExpires),
      iss: issuer,
    };

    const refreshTokenPayload = {
      ...payload,
      type: 'refresh',
      id: uuidv4(),
      associated: accessTokenPayload.id,
      exp: Math.floor(Date.now() / 1000) + Number(refreshExpires),
      iss: issuer,
    };

    const accessTokenString = jsonwebtoken.sign(accessTokenPayload, privateKey, { algorithm });
    const refreshTokenString = jsonwebtoken.sign(refreshTokenPayload, privateKey, { algorithm });

    return {
      accessToken: {
        token: accessTokenString,
        payload: {
          ...accessTokenPayload,
          type: 'access',
        },
      },
      refreshToken: {
        token: refreshTokenString,
        payload: {
          ...refreshTokenPayload,
          type: 'refresh',
        },
      },
    };
  }

  /**
   * Generate new tokens pair and register it
   */
  public async registerTokens(data: { uuid: string }): Promise<TokenPackage> {
    const { context } = this.props;
    const { knex, logger, services } = context;
    const { uuid } = data;


    const account = await services.accounts.getAccount(uuid);

    if (!account) {
      throw new UnauthorizedError(`Account with id[${uuid}] not found`);
    }

    const tokens = this.generateTokens({
      uuid: account.id,
      roles: ['authorized'].concat(account.roles),
    });

    try {
      await knex('tokens').insert([
        {
          id: tokens.accessToken.payload.id,
          account: tokens.accessToken.payload.uuid,
          type: 'access',
          expiredAt: moment(tokens.accessToken.payload.exp * 1000).format(),
        },
        {
          id: tokens.refreshToken.payload.id,
          account: tokens.refreshToken.payload.uuid,
          type: 'refresh',
          associated: tokens.accessToken.payload.id,
          expiredAt: moment(tokens.refreshToken.payload.exp * 1000).format(),
        },
      ]);
    } catch (err) {
      throw new ServerError('Failed to register tokens', err);
    }

    logger.auth.info('New Access token was registered', {
      accessTokenID: tokens.accessToken.payload.id,
      refreshTokenID: tokens.refreshToken.payload.id,
    });

    return tokens;
  }

  public extractTokenFromSubscription(connectionParams: any): string | false {
    if (typeof connectionParams === 'object' && TOKEN_BEARER_KEY in connectionParams) {
      const [bearer, token] = String(connectionParams[TOKEN_BEARER_KEY]).split(' ');

      if (bearer === TOKEN_BEARER && token !== '') {
        return String(token);
      }
    }

    return false;
  }

  public extractTokenFromRequest(request: IncomingMessage): string | false {
    const { headers } = request;

    // try to get access token from headers
    if (TOKEN_BEARER_KEY.toLocaleLowerCase() in headers) {
      const [bearer, tokenFromHeader] = String(headers[TOKEN_BEARER_KEY.toLocaleLowerCase()]).split(' ');

      if (bearer === TOKEN_BEARER && tokenFromHeader !== '') {
        return String(tokenFromHeader);
      }
    }

    return false;
  }

  public async verifyToken(token: string): Promise<AccessTokenPayload | never> {
    const { context } = this.props;
    const { redis, logger, jwt } = context;
    const { privateKey, algorithm } = jwt;

    const payload = jsonwebtoken.verify(String(token), privateKey, {
      algorithms: [algorithm],
    }) as AccessTokenPayload;


    const revokeStatus = await redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);
    if (revokeStatus) {
      logger.auth.debug('Token verification. Token was revoked', { payload });

      throw new UnauthorizedError('Token was revoked');
    }

    return payload;
  }
}

export default AuthentificationService;
