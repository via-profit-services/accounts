/* eslint-disable import/max-dependencies */
import type { User, UsersServiceProps } from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse, Phone } from '@via-profit-services/core';
import {
  convertWhereToKnex, convertOrderByToKnex,
  convertSearchToKnex, extractTotalCountPropOfNode,
} from '@via-profit-services/knex';

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


}

export default UsersService;
