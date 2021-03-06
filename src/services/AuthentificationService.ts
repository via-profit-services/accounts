import type {
  AccessTokenPayload,
  TokenPackage,
  AuthentificationService as AuthentificationServiceInterface,
  RefreshTokenPayload,
  AccountRole,
  AuthentificationServiceProps,
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

type PermissionsTableModel = {
  readonly typeName: string;
  readonly fieldName: string;
  readonly type: 'grant' | 'restrict';
  readonly privilege: string;
}

type PermissionsTableModelResult = PermissionsTableModel;

type PrivilegesTableModel = {
  readonly role: string;
  readonly privilege: string;
}

type PrivilegesTableModelResult = PrivilegesTableModel;

class AuthentificationService implements AuthentificationServiceInterface {
  props: AuthentificationServiceProps;

  public constructor(props: AuthentificationServiceProps) {
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


  public composeCredentials (login: string, password: string) {
    return `${login}.${password}`;
  }

    /**
   * Just crypt password
   */
  public cryptPassword(login: string, password: string) {
    const salt = bcryptjs.genSaltSync(10);
    const str = this.composeCredentials(login, password);

    return bcryptjs.hashSync(str, salt);
  }


  /**
   * Generate token pair (access + refresh)
   */
  public generateTokens(
    payload: {
      uuid: string;
      roles: AccountRole[];
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
      throw new ServerError(`Account with id[${uuid}] not found`);
    }

    const tokens = this.generateTokens({
      uuid: account.id,
      roles: account.roles,
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

  public async verifyToken(token: string): Promise<
  | AccessTokenPayload
  | RefreshTokenPayload
  | never> {
    const { context } = this.props;
    const { jwt } = context;
    const { privateKey, algorithm } = jwt;

    const payload = jsonwebtoken.verify(String(token), privateKey, {
      algorithms: [algorithm],
    }) as AccessTokenPayload | RefreshTokenPayload;

    return payload;
  }


  public isAccessTokenPayload(
    payload: AccessTokenPayload | RefreshTokenPayload,
  ): payload is AccessTokenPayload {
    return payload.type === 'access';
  }

  public isRefreshTokenPayload(
    payload: AccessTokenPayload | RefreshTokenPayload,
  ): payload is RefreshTokenPayload {
    return payload.type === 'refresh';
  }

  public async revokeAccountTokens(account: string): Promise<string[]> {
    const { knex } = this.props.context;

    const allTokens = await knex('tokens')
      .select(['id'])
      .where({ account })
      .where('expiredAt', '>=', knex.raw('now()'));

    const ids = allTokens.map((token: { id: string }) => token.id);

    if (ids.length) {
      await this.revokeToken(ids);
    }

    return ids;
  }

  public async revokeToken(accessTokenIdOrIds: string | string[]) {
    const { context } = this.props;
    const { logger, knex, redis } = context;

    const ids = Array.isArray(accessTokenIdOrIds) ? accessTokenIdOrIds : [accessTokenIdOrIds];

    redis.sadd(REDIS_TOKENS_BLACKLIST, ids);
    logger.auth.info('New tokens has been added in BlackList', { tokenIds: ids });

    const tokensList = await knex('tokens')
      .select(['tokens.account', 'tokens.id as access', 'refreshTokens.id as refresh'])
      .leftJoin('accounts', 'accounts.id', 'tokens.account')
      .leftJoin('tokens as refreshTokens', 'refreshTokens.associated', 'tokens.id')
      .whereIn('tokens.id', ids);

    tokensList.forEach((data: {
      account: string;
      access: string;
      refresh: string;
    }) => {
      logger.auth.info(`Revoke Access Token ${data.access} for account ${data.account}`, { data });
      logger.auth.info(`Revoke Refresh Token ${data.refresh} for account ${data.account}`, { data });
    });
  }

  public async extractTokenPrivileges(token: AccessTokenPayload): Promise<string[]> {
    const { roles } = token;
    const privilegesMap = await this.loadPrivileges();

    const tokenPrivileges = roles.reduce<string[]>((prev, role) => {
      const list = privilegesMap[role] || [];

      return prev.concat(list);
    }, []);

    return tokenPrivileges;
  }

  public async loadPrivileges() {
    const { context } = this.props;
    const { knex } = context;

    const privileges: Record<string, string[]> = {};
    const res = await knex
      .select('*')
      .from<PrivilegesTableModel, PrivilegesTableModelResult[]>('roles2privileges');

    if (res.length) {
      res.forEach(({ role, privilege }) => {
        privileges[role] = privileges[role] || [];
        privileges[role].push(privilege);
      })
    }

    return privileges;
  }
}

export default AuthentificationService;
