/* eslint-disable import/max-dependencies */
import type {
  Account, AccountsServiceProps, AccountsService as AccountsServiceInterface,
  AccountsTableModel, AccountsTableModelResult, AccountInputCreate, AccountInputUpdate,
} from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse, arrayOfIdsToArrayOfObjectIds } from '@via-profit-services/core';
import { convertWhereToKnex, convertOrderByToKnex, convertSearchToKnex, extractTotalCountPropOfNode } from '@via-profit-services/knex';
import bcryptjs from 'bcryptjs';
import moment from 'moment-timezone';
import '@via-profit-services/phones';
import { v4 as uuidv4 } from 'uuid';


class AccountsService implements AccountsServiceInterface {
  props: AccountsServiceProps;

  public constructor(props: AccountsServiceProps) {
    this.props = props;
  }


  public getDefaultAccountData(): Account {
    return {
      id: uuidv4(),
      login: uuidv4(),
      password: uuidv4(),
      status: 'allowed',
      roles: [],
      createdAt: moment().toDate(),
      updatedAt: moment().toDate(),
      entity: null,
      deleted: false,
      type: 'User',
      recoveryPhones: [],
    };
  }

  public prepareDataToInsert(
      input: Partial<AccountInputCreate | AccountInputUpdate>,
    ): Partial<AccountsTableModel> {
    const accountData: Partial<AccountsTableModel> = {
      ...input,
      status: input.status ? String(input.status) : undefined,
      roles: input.roles ? JSON.stringify(input.roles) : undefined,
    };

    return accountData;
  }

  public async getAccounts(
    filter: Partial<OutputFilter>,
    skipDeleted?: boolean,
  ): Promise<ListResponse<Account>> {
    const { context } = this.props;
    const { knex } = context;

    if (filter.search) {
      const search = [...filter.search];
      search.forEach(({ field, query }) => {
        if (field === 'recoveryPhone') {
          filter.search = filter.search || [];
          filter.search.push({
            field: 'number',
            query,
          });
        }
      });
    }

    const { limit, offset, orderBy, where, search } = filter;
    const aliases = {
      accounts: ['*'],
      phones: ['number'],
    };

    const request = knex
      .select([
        'accounts.*',
        knex.raw('count(*) over() as "totalCount"'),
        knex.raw('string_agg(distinct ??::text, ?::text) AS "recoveryPhones"', ['phones.id', '|']),
      ])
      .from<AccountsTableModel, AccountsTableModelResult[]>('accounts')
      .leftJoin('phones', 'phones.entity', 'accounts.id')
      .orderBy(convertOrderByToKnex(orderBy, aliases))
      .groupBy('accounts.id')
      .where((builder) => convertWhereToKnex(builder, where, aliases))
      .where((builder) => convertSearchToKnex(builder, search, aliases))
      .limit(limit || 1)
      .offset(offset || 0);

    if (skipDeleted) {
      request.where({
        deleted: false, 
      })
    }

    const response = await request;

    const nodes = response.map((node) => {
      const entity = node.entity ? { id: node.entity } : null
      const recoveryPhones = node.recoveryPhones
        ? arrayOfIdsToArrayOfObjectIds(node.recoveryPhones.split('|'))
        : null

      return {
        ...node,
        recoveryPhones,
        entity,
      }
    });


    const result: ListResponse<Account> = {
      ...extractTotalCountPropOfNode(response),
      nodes,
      offset,
      limit,
      orderBy,
      where,
    };


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

  public async getAccountsByEntities(entitiesIDs: string[]): Promise<ListResponse<Account>> {
    const phones = await this.getAccounts({
      limit: Number.MAX_SAFE_INTEGER,
      where: [
        ['entity', 'in', entitiesIDs],
      ],
    });

    return phones;
  }

  public async getAccountsByEntity(entityID: string): Promise<ListResponse<Account>> {
    return this.getAccountsByEntities([entityID]);
  }

  public async getAccountByLogin(login: string): Promise<Account | false> {
    const { nodes } = await this.getAccounts({
      limit: 1,
      offset: 0,
      where: [['login', '=', login]],
    });

    return nodes.length ? nodes[0] : false;
  }


  public async updateAccount(id: string, accountData: AccountInputUpdate) {
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const data = this.prepareDataToInsert({
      ...accountData,
      password: accountData.password
        ? authentification.cryptPassword(
          accountData.login,
          accountData.password,
        )
        : undefined,
    });

    await knex<AccountsTableModel>('accounts')
      .update({
        ...data,
        updatedAt: moment.tz(timezone).format(),
      })
      .where('id', id)
      .returning('id');
  }

  public async createAccount(accountData: AccountInputCreate) {
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const createdAt = moment.tz(timezone).format();

    const data = this.prepareDataToInsert({
      ...accountData,
      id: accountData.id ? accountData.id : uuidv4(),
      password: authentification.cryptPassword(
        accountData.login,
        accountData.password,
      ),
    });
    const result = await knex<AccountsTableModel>('accounts')
      .insert({
        ...data,
        createdAt,
        updatedAt: createdAt,
      })
      .returning('id');

    return result[0];
  }

  public async deleteAccounts(ids: string[]) {
    await Promise.all(ids.map((id) => this.updateAccount(id, {
      login: uuidv4(),
      password: uuidv4(),
      deleted: true,
      status: 'forbidden',
    })));
  }

  public async deleteAccount(id: string) {
    return this.deleteAccounts([id]);
  }

  public async checkLoginExists(login: string, skipId?: string): Promise<boolean> {
    const { context } = this.props;
    const { knex } = context;

    const request = knex<AccountsTableModel, AccountsTableModelResult[]>('accounts')
      .select('id')
      .where('login', '=', login);

    if (skipId) {
      request.whereNotIn('id', [skipId]);
    }

    const list = await request;

    return !!list.length;
  }


  public async getAccountByCredentials(login: string, password: string): Promise<Account | false> {
    const { context } = this.props;
    const { services } = context;
    const composedCredentials = services.authentification.composeCredentials(login, password);
    const account = await this.getAccountByLogin(login);

    if (!account) {
      return false;
    }

    if (bcryptjs.compareSync(composedCredentials, account.password)) {
      return account;
    }


    return false;
  }


  public getAccountStatusesList(): string[] {
    return ['allowed', 'forbidden'];
  }

  public async rebaseTypes(types: string[]): Promise<void> {
    const { context } = this.props;
    const { knex } = context;

    const payload = types.map((type) => ({ type }));
    await knex.raw(`${knex('accountsTypes').insert(payload).toString()} on conflict ("type") do nothing;`);
    await knex('accountsTypes').del().whereNotIn('type', types);
  }

  public getEntitiesTypes() {
    const { entities } = this.props;

    return entities;
  }
}

export default AccountsService;
