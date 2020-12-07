import type {
  Account, AccountsServiceProps, AccountInputInfo,
  AccountTableModelOutput, AccountStatus, AccessTokenPayload, TokenPackage,
} from '@via-profit-services/accounts';
import { OutputFilter, ListResponse, ServerError } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import jwt from 'jsonwebtoken';

import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

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

  public static cryptUserPassword(password: string) {
    const salt = bcryptjs.genSaltSync(10);

    return bcryptjs.hashSync(password, salt);
  }

  public static getAccountStatusesList(): string[] {
    return ['allowed', 'forbidden'];
  }

  public generateTokens(
    payload: Pick<AccessTokenPayload, 'uuid' | 'roles'>,
    exp?: {
      access: number;
      refresh: number;
    },
  ): TokenPackage {
    const { context } = this.props;

    const accessExpires = exp?.access ? exp.access : context.jwt.accessTokenExpiresIn;
    const refreshExpires = exp?.refresh ? exp.refresh : context.jwt.refreshTokenExpiresIn;

    // check file to access and readable
    try {
      fs.accessSync(context.jwt.privateKey);
    } catch (err) {
      throw new ServerError('Failed to open JWT privateKey file', { err });
    }

    const privatKey = fs.readFileSync(context.jwt.privateKey);

    const accessTokenPayload = {
      ...payload,
      type: 'access',
      id: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + Number(accessExpires),
      iss: context.jwt.issuer,
    };

    const refreshTokenPayload = {
      ...payload,
      type: 'refresh',
      id: uuidv4(),
      associated: accessTokenPayload.id,
      exp: Math.floor(Date.now() / 1000) + Number(refreshExpires),
      iss: context.jwt.issuer,
    };

    const accessToken = jwt.sign(accessTokenPayload, privatKey, {
      algorithm: context.jwt.algorithm,
    });


    const refreshToken = jwt.sign(refreshTokenPayload, privatKey, {
      algorithm: context.jwt.algorithm,
    });

    return {
      accessToken: {
        token: accessToken,
        payload: {
          ...accessTokenPayload,
          type: 'access',
        },
      },
      refreshToken: {
        token: refreshToken,
        payload: {
          ...refreshTokenPayload,
          type: 'refresh',
        },
      },
    };
  }

  public static getDefaultAccountData(): AccountInputInfo {
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
      .limit(limit)
      .offset(offset)
      .then((nodes) => ({
          offset,
          limit,
          orderBy,
          where,
          ...extractTotalCountPropOfNode(nodes),
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
      data.password = 'dsdsdsd';
      // data.password = AuthService.cryptUserPassword(data.password);
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
      password: 'dsdsdsd',
      // password: AuthService.cryptUserPassword(accountData.password),
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
}

export default AccountsService;
