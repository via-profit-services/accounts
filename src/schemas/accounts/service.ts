import {
  TWhereAction,
  TOutputFilter,
  IListResponse,
  convertWhereToKnex,
  convertOrderByToKnex,
  schemas,
} from '@via-profit-services/core';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import {
  Context, IAccount, IAccountTableModelOutput, IAccountUpdateInfo,
  IAccountCreateInfo, AccountStatus,
} from './types';

const AuthService = schemas.auth.service;


class Accounts {
  public props: IProps;

  public constructor(props: IProps) {
    this.props = props;
  }

  public static getDefaultAccountData(): IAccountCreateInfo {
    return {
      id: uuidv4(),
      name: 'Unnamed',
      login: uuidv4(),
      password: uuidv4(),
      status: AccountStatus.allowed,
      roles: [],
      createdAt: moment().format(),
      updatedAt: moment().format(),

    };
  }

  public prepareDataToInsert(accountInputData: Partial<IAccountCreateInfo>) {
    const { timezone } = this.props.context;

    const accountData: Partial<IAccountCreateInfo> = {
      ...accountInputData,
      updatedAt: moment.tz(timezone).format(),
    };

    if (accountData.roles) {
      accountData.roles = JSON.stringify(accountData.roles);
    }

    return accountData;
  }


  public async getAccounts(filter: Partial<TOutputFilter>): Promise<IListResponse<IAccount>> {
    const { context } = this.props;
    const { knex } = context;
    const {
      limit,
      offset,
      orderBy,
      where,
    } = filter;

    const nodes = await knex
      .select([
        'accounts.*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .from<IAccountTableModelOutput, IAccountTableModelOutput[]>('accounts')
      .orderBy(convertOrderByToKnex(orderBy))
      .where((builder) => convertWhereToKnex(builder, where))
      .where((builder) => builder.where('deleted', false))
      .limit(limit)
      .offset(offset);
    return ({
      totalCount: nodes.length ? Number(nodes[0].totalCount) : 0,
      limit,
      offset,
      nodes,
      where,
      orderBy,
    });
  }

  public async getAccountsByIds(ids: string[]): Promise<IAccount[]> {
    const { nodes } = await this.getAccounts({
      where: [['id', TWhereAction.IN, ids]],
      offset: 0,
      limit: ids.length,
    });
    return nodes;
  }

  public async getAccount(id: string): Promise<IAccount | false> {
    const nodes = await this.getAccountsByIds([id]);
    return nodes.length ? nodes[0] : false;
  }

  public async getAccountByLogin(login: string): Promise<IAccount | false> {
    const { nodes } = await this.getAccounts({
      limit: 1,
      offset: 0,
      where: [['login', TWhereAction.EQ, login]],
    });

    return nodes.length ? nodes[0] : false;
  }


  public async updateAccount(id: string, accountData: Partial<IAccountUpdateInfo>) {
    const { knex, timezone } = this.props.context;
    const data = this.prepareDataToInsert({
      ...accountData,
      updatedAt: moment.tz(timezone).format(),
    });
    await knex<IAccountUpdateInfo>('accounts')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createAccount(accountData: Partial<IAccountCreateInfo>) {
    const { knex, timezone } = this.props.context;
    const createdAt = moment.tz(timezone).format();

    const data = this.prepareDataToInsert({
      ...accountData,
      id: accountData.id ? accountData.id : uuidv4(),
      password: AuthService.cryptUserPassword(accountData.password),
      createdAt,
      updatedAt: createdAt,
    });
    const result = await knex<IAccountCreateInfo>('accounts').insert(data).returning('id');

    return result[0];
  }

  public async deleteAccount(id: string) {
    return this.updateAccount(id, {
      login: uuidv4(),
      password: uuidv4(),
      deleted: true,
      status: AccountStatus.forbidden,
    });
  }
}

export default Accounts;

interface IProps {
  context: Context;
}
