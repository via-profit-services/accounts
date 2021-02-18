/* eslint-disable import/max-dependencies */
import type { User, UsersServiceProps, UsersTableModelResult, UsersTableModel, UserInputCreate, UserInputUpdate } from '@via-profit-services/accounts';
import '@via-profit-services/redis';
import { OutputFilter, ListResponse, arrayOfIdsToArrayOfObjectIds } from '@via-profit-services/core';
import { convertWhereToKnex, convertOrderByToKnex, extractTotalCountPropOfNode } from '@via-profit-services/knex';
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

    const response = await knex
      .select([
        'users.*',
        knex.raw('count(*) over() as "totalCount"'),
        knex.raw('string_agg(distinct ??::text, ?::text) AS "avatars"', ['avatars.id', '|']),
        knex.raw('string_agg(distinct ??::text, ?::text) AS "phones"', ['phones.id', '|']),
        knex.raw('string_agg(distinct ??::text, ?::text) AS "accounts"', ['accounts.id', '|']),
        knex.raw('string_agg(distinct ??::text, ?::text) AS "files"', ['fileStorage.id', '|']),
      ])
      .from<UsersTableModel, UsersTableModelResult[]>('users')
      .leftJoin('phones', 'phones.entity', 'users.id')
      .leftJoin('accounts', 'accounts.entity', 'users.id')
      .leftJoin('fileStorage', 'fileStorage.owner', 'users.id')
      .joinRaw('left join "fileStorage" as avatars on "fileStorage"."owner" = "users".id and "fileStorage"."category" = ?', ['Avatar'])
      .orderBy(convertOrderByToKnex(orderBy, {
        users: '*',
        accounts: ['login'],
      }))
      .groupBy(['users.id', 'users.name'])
      .where((builder) => convertWhereToKnex(builder, where, {
        users: '*',
        accounts: ['login'],
      }))
      .where((builder) => {
        if (search && search.length) {
          search.forEach(({ field, query }) => {
            switch (field) {
              case 'phone':
                builder.orWhere('phones.number', 'ilike', `%${query}%`);
                break;

              case 'login':
                builder.orWhere(`accounts.${field}`, 'ilike', `%${query}%`);
                break;

              default:
                  builder.orWhere(`users.${field}`, 'ilike', `%${query}%`);
                break;
            }
           });
        }

        return builder;
      })
      .limit(limit || 1)
      .offset(offset || 0);

    const nodes = response.map((node) => {
      const phones = !node.phones ? null : arrayOfIdsToArrayOfObjectIds(node.phones.split('|'));
      const accounts = !node.accounts ? null : arrayOfIdsToArrayOfObjectIds(node.accounts.split('|'));
      const files = !node.files ? null : arrayOfIdsToArrayOfObjectIds(node.files.split('|'));
      const avatars = !node.avatars ? null : arrayOfIdsToArrayOfObjectIds(node.avatars.split('|'));
      const avatar = !avatars ? null : avatars[0];

      return {
        ...node,
        accounts,
        avatar,
        files,
        phones,
      }
    });

    const result: ListResponse<User> = {
      ...extractTotalCountPropOfNode(response),
      nodes,
      offset,
      limit,
      orderBy,
      where,
    };

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


  public prepareDataToInsert(
    input: Partial<UserInputCreate | UserInputUpdate>,
  ): Partial<UsersTableModel> {
    const userData: Partial<UsersTableModel> = {
      ...input,
    };

    return userData;
  }

  public async updateUser(id: string, userData: UserInputUpdate) {
    const { knex, timezone } = this.props.context;

    await knex<UsersTableModel>('users')
      .update({
        ...this.prepareDataToInsert(userData),
        updatedAt: moment.tz(timezone).format(),
      })
      .where('id', id)
      .returning('id');
  }

  public async createUser(userData: UserInputCreate) {
    const { knex, timezone } = this.props.context;
    const createdAt = moment.tz(timezone).format();

    const data = this.prepareDataToInsert({
      ...userData,
      id: userData.id ? userData.id : uuidv4(),
    });
    const result = await knex<UsersTableModel>('users')
      .insert({
        ...data,
        createdAt,
        updatedAt: createdAt,
      })
      .returning('id');

    return result[0];
  }

  public async deleteUsers(ids: string[]) {
    await Promise.all(ids.map((id) => this.updateUser(id, {
      deleted: true,
    })));
  }

  public async deleteUser(id: string) {
    return this.deleteUsers([id]);
  }

}

export default UsersService;
