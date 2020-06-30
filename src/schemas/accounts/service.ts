import {
  TWhereAction,
  TOutputFilter,
  IListResponse,
  convertWhereToKnex,
  convertOrderByToKnex,
  extractNodeIds,
  IDirectionRange,
  arrayOfIdsToArrayOfObjectIds,
  AuthService,
} from '@via-profit-services/core';
import { FileStorage } from '@via-profit-services/file-storage';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import {
  Context, IAccount, IAccountTableModelOutput, IAccountUpdateInfo,
  IAccountCreateInfo, AccountStatus,
} from './types';


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

    const response = await knex
      .select([
        'accounts.*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .from<IAccountTableModelOutput, IAccountTableModelOutput[]>('accounts')
      .orderBy(convertOrderByToKnex(orderBy))
      .where((builder) => convertWhereToKnex(builder, where))
      .where((builder) => builder.where('deleted', false))
      .limit(limit)
      .offset(offset)
      .then(async (nodes) => {
        const fileStorage = new FileStorage({ context });
        const fileList = await fileStorage.getFiles({
          limit: nodes.length * 100,
          where: [['owner', TWhereAction.IN, extractNodeIds(nodes)]],
          orderBy: [{ field: 'createdAt', direction: IDirectionRange.ASC }],
        });

        return {
          totalCount: nodes.length ? Number(nodes[0].totalCount) : 0,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          nodes: nodes.map(({ totalCount, ...nodeData }) => {
            // get file of current driver
            const files = fileList.nodes.filter((f) => f.owner === nodeData.id) || null;
            const avatar = files.find((f) => f.category === 'avatar') || null;

            return {
              ...nodeData,
              files: files ? arrayOfIdsToArrayOfObjectIds(files.map((f) => f.id)) : null,
              avatar: avatar ? { id: avatar.id } : null,
            };
          }),
        };
      });

    const { totalCount, nodes } = response;


    return {
      totalCount,
      nodes,
      where,
      orderBy,
      limit,
      offset,
    };
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
    if (data.password) {
      data.password = AuthService.cryptUserPassword(data.password);
    }
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

  public async checkLoginExists(login: string, skipId: string): Promise<boolean> {
    const { context } = this.props;
    const { knex } = context;

    const list = await knex<IAccountTableModelOutput, IAccountTableModelOutput[]>('accounts')
      .select('id')
      .where('login', TWhereAction.EQ, login)
      .whereNot('id', skipId);

    return !!list.length;
  }
}

export default Accounts;

interface IProps {
  context: Context;
}
