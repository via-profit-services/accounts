import type {
  PermissionsService as PermissionsServiceInterface,
  PermissionsServiceProps,
  PermissionResolverComposed,
  PermissionResolver,
  ResolvePermissions,
  PermissionsMap,
} from '@via-profit-services/accounts';
import { OutputFilter, ListResponse, ServerError } from '@via-profit-services/core';
import { convertOrderByToKnex, convertSearchToKnex, convertWhereToKnex, extractTotalCountPropOfNode, convertJsonToKnex } from '@via-profit-services/knex';
import Knex from 'knex';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import { DEFAULT_PERMISSIONS_MAP_ID, DEFAULT_PERMISSIONS_MAP } from '../constants';

type PermissionsMapTable = {
  readonly id: string;
  readonly map: string | Knex.Raw;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type PermissionsMapTableResult = {
  readonly id: string;
  readonly map: Record<string, PermissionResolver>;
  readonly description: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly totalCount: number;
}


class PermissionsService implements PermissionsServiceInterface {
  props: PermissionsServiceProps;

  public constructor(props: PermissionsServiceProps) {
    this.props = props;
  }

  public setActiveMapID (id: string) {
    this.props.activeMapID = id;
  }

  public async getActiveMapID () {
    const { activeMapID } = this.props;
    if (activeMapID) {
      return activeMapID;
    }

    const { nodes } = await this.getPermissionMaps({
      where: [['id', '=', DEFAULT_PERMISSIONS_MAP_ID]],
      limit: 1,
     });

    if (nodes) {
      const { id } = nodes[0];
      this.setActiveMapID(id);

      return id;
    }

    throw new ServerError('Failed to get active map ID');
  }

  public composePermissionResolver (resolver: PermissionResolver): PermissionResolverComposed {
    const composedResolver: PermissionResolverComposed = {
      grant: [],
      restrict: [],
    }

    if ('grant' in resolver && Array.isArray(resolver.grant)) {
      composedResolver.grant = resolver.grant;
    }

    if ('grant' in resolver && typeof resolver.grant === 'string') {
      composedResolver.grant = [resolver.grant];
    }

    if ('restrict' in resolver && Array.isArray(resolver.restrict)) {
      composedResolver.restrict = resolver.restrict;
    }

    if ('restrict' in resolver && typeof resolver.restrict === 'string') {
      composedResolver.restrict = [resolver.restrict];
    }

    return composedResolver;
  }

  public resolvePermissions (props: ResolvePermissions): boolean {
    const { resolver, roles } = props;
    const { restrict, grant } = resolver;

    // resolve permissions or return true if array are empty
    const needToRestrict = !restrict.length ? false : restrict.map((negative) => {

      if (negative === '*') {
        return true;
      }

      return roles.includes(negative);

    }).includes(true);

    // resolve permissions or return true if array are empty
    const needToGrant = !grant.length ? true : grant.map((positive) => {

      if (positive === '*') {
        return true;
      }

      return roles.includes(positive);

    }).includes(true);

    const result = !needToRestrict && needToGrant;

    return result;
  }


  public async getPermissionMaps(
    filter: Partial<OutputFilter>): Promise<ListResponse<PermissionsMap>> {
    const { context } = this.props;
    const { knex } = context;
    const { limit, offset, orderBy, where, search } = filter;

    const result = await knex
      .select([
        'permissionsMap.*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .from<PermissionsMapTable, PermissionsMapTableResult[]>('permissionsMap')
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

  public async getPermissionMapsByIds(ids: string[]): Promise<PermissionsMap[]> {
    const { nodes } = await this.getPermissionMaps({
      where: [['id', 'in', ids]],
      offset: 0,
      limit: ids.length,
    });

    return nodes;
  }

  public async getPermissionMap(id: string): Promise<PermissionsMap | false> {
    const nodes = await this.getPermissionMapsByIds([id]);

    return nodes.length ? nodes[0] : false;
  }

  public async updatePermissionsMap(
    id: string,
    permissionsMap: Partial<PermissionsMap>,
  ): Promise<void> {
    const { knex, timezone } = this.props.context;

    const data: Partial<PermissionsMapTable> = {
      ...permissionsMap,
      updatedAt: moment.tz(timezone).format(), // force set updatedAt
      createdAt: undefined, // force remove createdAt
      map: permissionsMap.map ? convertJsonToKnex(knex, permissionsMap.map) : undefined,
    };

    await knex<PermissionsMapTable>('permissionsMap')
      .update(data)
      .where('id', id)
      .returning('id');
  }

  public async createPermissionsMap(permissionsMap: Partial<PermissionsMap>): Promise<string> {
    const { knex, timezone } = this.props.context;
    const createdAt = moment.tz(timezone).format();

    const result = await knex<PermissionsMapTable>('permissionsMap')
      .insert({
        id: permissionsMap.id || uuidv4(),
        description: permissionsMap.description || '',
        createdAt,
        updatedAt: createdAt,
      })
      .returning('id');

    return result[0];
  }

  public getDefaultPermissionsMapContent () {
    return DEFAULT_PERMISSIONS_MAP;
  }
}

export default PermissionsService;
