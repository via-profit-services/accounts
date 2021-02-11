/* eslint-disable import/max-dependencies */
import type {
  Account, AccountsServiceProps, AccountsService as AccountsServiceInterface,
  AccountsTableModel, AccountsTableModelResult,
} from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse, arrayOfIdsToArrayOfObjectIds } from '@via-profit-services/core';
import { convertWhereToKnex, convertOrderByToKnex, extractTotalCountPropOfNode } from '@via-profit-services/knex';
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

  public prepareDataToInsert(input: Partial<Account>): Partial<AccountsTableModel> {
    const { context } = this.props;
    const { timezone } = context;
    const accountData: Partial<AccountsTableModel> = {
      ...input,
      entity: input?.entity?.id ? input.entity.id : undefined,
      status: input.status ? String(input.status) : undefined,
      roles: input.roles ? JSON.stringify(input.roles) : undefined,
      createdAt: input.createdAt ? moment.tz(input.createdAt, timezone).format() : undefined,
      updatedAt: input.updatedAt ? moment.tz(input.updatedAt, timezone).format() : undefined,
    };

    return accountData;
  }

  public async getAccounts(filter: Partial<OutputFilter>): Promise<ListResponse<Account>> {
    const { context } = this.props;
    const { knex } = context;
    const { limit, offset, orderBy, where, search } = filter;

    const response = await knex
      .select([
        'accounts.*',
        knex.raw('count(*) over() as "totalCount"'),
        knex.raw('string_agg(??::text, ?::text) AS "recoveryPhone"', ['phones.id', '|']),
      ])
      .from<AccountsTableModel, AccountsTableModelResult[]>('accounts')
      .leftJoin('phones', 'phones.entity', 'accounts.id')
      .leftJoin('users', 'accounts.entity', 'users.id')
      .orderBy(convertOrderByToKnex(orderBy, {
        accounts: ['*'],
        users: ['name'],
      }))
      .groupBy('accounts.id')
      .groupBy('users.name')
      .where((builder) => convertWhereToKnex(builder, where, {
        accounts: '*',
        users: ['name'],
      }))
      .where((builder) => {
        const whereArrayStr: string[] = [];
        const bindings: Record<string, any> = {};

        if (search && search.length) {
          search.forEach(({ field, query }, index) => {
            switch (field) {
              case 'recoveryPhone':
                whereArrayStr.push(`:SearchFieldPhone${index}: ilike :SearchQueryPhone${index}`);
                bindings[`SearchFieldPhone${index}`] = 'phones.number';
                bindings[`SearchQueryPhone${index}`] = `%${query}%`;
                break;

              case 'name':
                whereArrayStr.push(`:SearchField${field}${index}: ilike :SearchQuery${field}${index}`);
                bindings[`SearchField${field}${index}`] = `users.${field}`;
                bindings[`SearchQuery${field}${index}`] = `%${query}%`;
                break;

              default:
                whereArrayStr.push(`:SearchField${field}${index}: ilike :SearchQuery${field}${index}`);
                bindings[`SearchField${field}${index}`] = `accounts.${field}`;
                bindings[`SearchQuery${field}${index}`] = `%${query}%`;
                break;
            }
           });
        }

        return builder.orWhereRaw(whereArrayStr.join(' or '), bindings);
      })
      .limit(limit || 1)
      .offset(offset || 0);

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


  public async updateAccount(id: string, accountData: Partial<Account>) {
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const data = this.prepareDataToInsert({
      ...accountData,
      updatedAt: moment.tz(timezone).toDate(),
      password: accountData.password
        ? authentification.cryptUserPassword(
          accountData.login,
          accountData.password,
        )
        : undefined,
    });

    await knex<AccountsTableModel>('accounts')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createAccount(accountData: Partial<Account>) {
    const { knex, timezone, services } = this.props.context;
    const { authentification } = services;
    const createdAt = moment.tz(timezone).toDate();

    const data = this.prepareDataToInsert({
      ...accountData,
      id: accountData.id ? accountData.id : uuidv4(),
      password: authentification.cryptUserPassword(
        accountData.login,
        accountData.password,
      ),
      createdAt,
      updatedAt: createdAt,
    });
    const result = await knex<AccountsTableModel>('accounts').insert(data).returning('id');

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
