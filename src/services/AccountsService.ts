/* eslint-disable import/max-dependencies */
import type {
  Account, AccountsServiceProps, AccountInputInfo, AccountsService as AccountsServiceInterface,
  AccountTableModelOutput, AccountStatus, User,
} from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse, Phone } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';
import bcryptjs from 'bcryptjs';
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

interface UsersTableModel {
  readonly id: string;
  readonly name: string;
  readonly account: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly phones: string;
  readonly deleted: boolean;
  readonly totalCount: number;
}

interface UsersTableModelResult {
  readonly id: string;
  readonly name: string;
  readonly account: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly phones: Phone[];
  readonly deleted: boolean;
  readonly totalCount: number;
}


class AccountsService implements AccountsServiceInterface {
  props: AccountsServiceProps;

  public constructor(props: AccountsServiceProps) {
    this.props = props;
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
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const data = this.prepareDataToInsert({
      ...accountData,
      updatedAt: moment.tz(timezone).format(),
    });
    if (data.password) {
      data.password = authentification.cryptUserPassword(data.password);
    }
    await knex<AccountInputInfo>('accounts')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createAccount(accountData: Partial<AccountInputInfo>) {
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const createdAt = moment.tz(timezone).format();

    const data = this.prepareDataToInsert({
      ...accountData,
      id: accountData.id ? accountData.id : uuidv4(),
      password: authentification.cryptUserPassword(accountData.password),
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


  public async getUsers(filter: Partial<OutputFilter>): Promise<ListResponse<User>> {
    const { context } = this.props;
    const { knex } = context;
    const { limit, offset, orderBy, where, search } = filter;

    const result = await knex
      .select([
        'users.*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .from<UsersTableModel, UsersTableModelResult[]>('users')
      .orderBy(convertOrderByToKnex(orderBy))
      .where((builder) => convertWhereToKnex(builder, where))
      .where((builder) => convertSearchToKnex(builder, search))
      .limit(limit || 1)
      .offset(offset || 0)
      .then((nodes) => nodes.map((node) => ({
        ...node,
        account: !node.account ? null : {
          id: node.account,
        },
      })))
      .then((nodes) => ({
        ...extractTotalCountPropOfNode(nodes),
          offset,
          limit,
          orderBy,
          where,
        }))

    return result;
  }

  public async getUsersByIds(ids: string[]): Promise<User[]> {
    const { nodes } = await this.getUsers({
      where: [['id', 'in', ids]],
      offset: 0,
      limit: ids.length,
    });

    return nodes;
  }

  public async getUser(id: string): Promise<User | false> {
    const nodes = await this.getUsersByIds([id]);

    return nodes.length ? nodes[0] : false;
  }

  public getAccountStatusesList(): string[] {
    return ['allowed', 'forbidden'];
  }
}

export default AccountsService;
