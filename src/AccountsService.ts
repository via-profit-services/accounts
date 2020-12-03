import type {
  Account, AccountsServiceProps, AccountInputInfo,
  AccountTableModelOutput, AccountStatus,
} from '@via-profit-services/accounts';
import { OutputFilter, ListResponse } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';

import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

interface AccountsTableModel {
  id: string;
  login: string;
  createdAt: string;
  updatedAt: string;
  password: string;
  roles: string;
  status: string;
  deleted: boolean;
  totalCount: number;
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

  public async checkLoginExists(login: string, skipId: string): Promise<boolean> {
    const { context } = this.props;
    const { knex } = context;

    const list = await knex<AccountTableModelOutput, AccountTableModelOutput[]>('accounts')
      .select('id')
      .where('login', '=', login)
      .whereNot('id', skipId);

    return !!list.length;
  }
}

export default AccountsService;
