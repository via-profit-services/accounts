/* eslint-disable import/max-dependencies */
import type { User, UsersServiceProps, UsersTableModelResult, UsersTableModel } from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

class UsersService {
  props: UsersServiceProps;

  public constructor(props: UsersServiceProps) {
    this.props = props;
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


  public prepareDataToInsert(input: Partial<User>): Partial<UsersTableModel> {
    const { context } = this.props;
    const { timezone } = context;
    const userData: Partial<UsersTableModel> = {
      ...input,
      account: input.account ? input.account.id : undefined,
      phones: input.phones ? JSON.stringify(input.phones) : undefined,
      createdAt: input.createdAt ? moment.tz(input.createdAt, timezone).format() : undefined,
      updatedAt: input.updatedAt ? moment.tz(input.updatedAt, timezone).format() : undefined,
    };

    return userData;
  }

  public async updateUser(id: string, userData: Partial<User>) {
    const { knex, timezone } = this.props.context;

    const data = this.prepareDataToInsert({
      ...userData,
      updatedAt: moment.tz(timezone).toDate(),
    });

    await knex<UsersTableModel>('users')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createUser(userData: Partial<User>) {
    const { knex, timezone } = this.props.context;
    const createdAt = moment.tz(timezone).toDate();

    const data = this.prepareDataToInsert({
      ...userData,
      id: userData.id ? userData.id : uuidv4(),
      createdAt,
      updatedAt: createdAt,
    });
    const result = await knex<UsersTableModel>('accounts').insert(data).returning('id');

    return result[0];
  }

  public async deleteUser(id: string) {
    return this.updateUser(id, {
      deleted: true,
    });
  }

}

export default UsersService;
