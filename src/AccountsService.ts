/* eslint-disable import/max-dependencies */
import type {
  Account, AccountsServiceProps, AccountInputInfo, AccessTokenPayload,
  AccountTableModelOutput, AccountStatus, TokenPackage,
} from '@via-profit-services/accounts';
import '@via-profit-services/subscriptions';
import { OutputFilter, ListResponse, ServerError } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';
import bcryptjs from 'bcryptjs';
import { IncomingMessage } from 'http';
import jsonwebtoken from 'jsonwebtoken';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import { TOKEN_BEARER_KEY, TOKEN_BEARER, REDIS_TOKENS_BLACKLIST } from './constants';
import UnauthorizedError from './UnauthorizedError';

interface AccountsTableModel {
  readonly id: string;
  readonly login: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly password: string;
  readonly roles: string;
  readonly status: string;
  readonly deleted: boolean;
  readonly totalCount: number;
}

interface AccountsTableModelResult {
  readonly id: string;
  readonly login: string;
  readonly password: string;
  readonly roles: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly totalCount: number;
  readonly status: AccountStatus;
  readonly deleted: boolean;
}


class AccountsService {
  props: AccountsServiceProps;

  public constructor(props: AccountsServiceProps) {
    this.props = props;
  }

  /**
   * Just crypt password
   */
  public cryptUserPassword(password: string) {
    const salt = bcryptjs.genSaltSync(10);

    return bcryptjs.hashSync(password, salt);
  }

  public getAccountStatusesList(): string[] {
    return ['allowed', 'forbidden'];
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
    const { knex, logger } = context;
    const { uuid } = data;

    const account = await this.getAccount(uuid);

    if (!account) {
      throw new UnauthorizedError(`Account with id[${uuid}] not found`);
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


  public getDefaultAccountData(): AccountInputInfo {
    return {
      id: uuidv4(),
      login: uuidv4(),
      password: uuidv4(),
      status: 'allowed',
      roles: [],
      createdAt: moment().format(),
      updatedAt: moment().format(),
    };
  }

  public prepareDataToInsert(accountInputData: Partial<AccountInputInfo>) {
    const { context } = this.props;
    const { timezone } = context;
    const accountData: Partial<AccountInputInfo> = {
      ...accountInputData,
      updatedAt: moment.tz(timezone).format(),
    };

    if (accountData.roles) {
      accountData.roles = JSON.stringify(accountData.roles);
    }

    return accountData;
  }

  public async getAccounts(filter: Partial<OutputFilter>): Promise<ListResponse<Account>> {
    const { context } = this.props;
    const { knex } = context;
    const { limit, offset, orderBy, where, search } = filter;

    const result = await knex
      .select([
        'accounts.*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .from<AccountsTableModel, AccountsTableModelResult[]>('accounts')
      .orderBy(convertOrderByToKnex(orderBy))
      .where((builder) => convertWhereToKnex(builder, where))
      .where((builder) => convertSearchToKnex(builder, search))
      .limit(limit || 1)
      .offset(offset || 0)
      .then((nodes) => ({
        ...extractTotalCountPropOfNode(nodes),
          offset,
          limit,
          orderBy,
          where,
        }))

    return result;
  }

  public async getAccountsByIds(ids: string[]): Promise<Account[]> {
    const { nodes } = await this.getAccounts({
      where: [['id', 'in', ids]],
      offset: 0,
      limit: ids.length,
    });

    return nodes;
  }

  public async getAccount(id: string): Promise<Account | false> {
    const nodes = await this.getAccountsByIds([id]);

    return nodes.length ? nodes[0] : false;
  }

  public async getAccountByLogin(login: string): Promise<Account | false> {
    const { nodes } = await this.getAccounts({
      limit: 1,
      offset: 0,
      where: [['login', '=', login]],
    });

    return nodes.length ? nodes[0] : false;
  }


  public async updateAccount(id: string, accountData: Partial<AccountInputInfo>) {
    const { knex, timezone } = this.props.context;
    const data = this.prepareDataToInsert({
      ...accountData,
      updatedAt: moment.tz(timezone).format(),
    });
    if (data.password) {
      data.password = this.cryptUserPassword(data.password);
    }
    await knex<AccountInputInfo>('accounts')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createAccount(accountData: Partial<AccountInputInfo>) {
    const { knex, timezone } = this.props.context;
    const createdAt = moment.tz(timezone).format();

    const data = this.prepareDataToInsert({
      ...accountData,
      id: accountData.id ? accountData.id : uuidv4(),
      password: this.cryptUserPassword(accountData.password),
      createdAt,
      updatedAt: createdAt,
    });
    const result = await knex<AccountInputInfo>('accounts').insert(data).returning('id');

    return result[0];
  }

  public async deleteAccount(id: string) {
    return this.updateAccount(id, {
      login: uuidv4(),
      password: uuidv4(),
      deleted: true,
      status: 'forbidden',
    });
  }

  public async checkLoginExists(login: string, skipId?: string): Promise<boolean> {
    const { context } = this.props;
    const { knex } = context;

    const request = knex<AccountTableModelOutput, AccountTableModelOutput[]>('accounts')
      .select('id')
      .where('login', '=', login);

    if (skipId) {
      request.whereNotIn('id', [skipId]);
    }

    const list = await request;

    return !!list.length;
  }


  public async getAccountByCredentials(login: string, password: string): Promise<Account | false> {
    const account = await this.getAccountByLogin(login);
    if (account && bcryptjs.compareSync(String(password), String(account.password))) {
      return account;
    }

    return false;
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

  public async verifyToken(token: string): Promise<AccessTokenPayload | false> {
    const { context } = this.props;
    const { redis, logger, jwt } = context;
    const { privateKey, algorithm } = jwt;

    try {
      const payload = jsonwebtoken.verify(String(token), privateKey, {
        algorithms: [algorithm],
      }) as AccessTokenPayload;

      const revokeStatus = await redis.sismember(REDIS_TOKENS_BLACKLIST, payload.id);
      if (revokeStatus) {
        logger.auth.info('Token was revoked', { payload });

        return false;
      }

      return payload;
    } catch (err) {
      logger.auth.info('Invalid token', { err });
      logger.server.error('Failed to validate the token', { err });

      return false;
    }
  }


}

export default AccountsService;
