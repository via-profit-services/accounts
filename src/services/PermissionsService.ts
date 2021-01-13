import type {
  PermissionsService as PermissionsServiceInterface,
  PermissionsServiceProps,
  ResolvePermissionsProps,
  PrivilegesMap,
  PermissionsMap,
  PermissionsMapResolver,
} from '@via-profit-services/accounts';

import { AUTHORIZED_PRIVILEGE } from '../constants';

type PermissionsTableModel = {
  readonly typeName: string;
  readonly fieldName: string;
  readonly type: 'grant' | 'restrict';
  readonly privilege: string;
}

type PermissionsTableModelResult = PermissionsTableModel;

type PrivilegesTableModel = {
  readonly role: string;
  readonly privilege: string;
}

type PrivilegesTableModelResult = PrivilegesTableModel;

class PermissionsService implements PermissionsServiceInterface {
  props: PermissionsServiceProps;

  public constructor(props: PermissionsServiceProps) {
    this.props = props;
  }

  public resolvePermissions (props: ResolvePermissionsProps): boolean {
    const {
      permissionsMap, privileges, fieldName, typeName,
      authorizationToAll, grantToAll, restrictToAll,
    } = props;
    const { map } = permissionsMap;
    const pathWithoutField = `${typeName}.*`;
    const pathWithField = `${typeName}.${fieldName}`;
    const resolver: PermissionsMapResolver = {
      grant: [

        // append permission without field (e.g.: «MyType.*)
        ...map[pathWithoutField]?.grant || [],

        // append permission with field (e.g.: «MyType.field»)
        ...map[pathWithField]?.grant || [],

        // append «authorized» permission
        ...authorizationToAll ? [AUTHORIZED_PRIVILEGE] : [],

        // append any permissions
        ...grantToAll || [],
      ],
      restrict: [
        // append permission without field (e.g.: «MyType.*)
        ...map[pathWithoutField]?.restrict || [],

        // append permission with field (e.g.: «MyType.field»)
        ...map[pathWithField]?.restrict || [],

        // append any permissions
        ...restrictToAll || [],
      ],
    };


    const { restrict, grant } = resolver;

    // resolve permissions or return true if array are empty
    const needToRestrict = !restrict.length ? false : restrict.map((negative) => {

      if (negative === '*') {
        return true;
      }

      return privileges.includes(negative);

    }).includes(true);

    // resolve permissions or return true if array are empty
    const needToGrant = !grant.length ? true : grant.map((positive) => {

      if (privileges.includes('*') || positive === '*') {
        return true;
      }

      return privileges.includes(positive);

    }).every((elem) => elem);

    const result = !needToRestrict && needToGrant;

    return result;
  }

  public async getPermissionsMap(): Promise<PermissionsMap> {
    const { context } = this.props;
    const { knex } = context;

    const permissionsMap: PermissionsMap = {
      id: 'common',
      createdAt: new Date(),
      updatedAt: new Date(),
      map: {},
    };
    const res = await knex
      .select('*')
      .from<PermissionsTableModel, PermissionsTableModelResult[]>('permissions');

    if (res.length) {
      res.forEach(({ typeName, fieldName, type, privilege }) => {
        const field = `${typeName}.${fieldName}`;
        permissionsMap.map[field] = permissionsMap.map[field] || {
          grant: [],
          restrict: [],
        };

        permissionsMap.map[field][type].push(privilege);
      })
    }

    return permissionsMap;
  }

  public async getPrivilegesMap(): Promise<PrivilegesMap> {
    const { context } = this.props;
    const { knex } = context;

    const privilegesMap: PrivilegesMap = {
      id: 'common',
      createdAt: new Date(),
      updatedAt: new Date(),
      map: {},
    };
    const res = await knex
      .select('*')
      .from<PrivilegesTableModel, PrivilegesTableModelResult[]>('roles2privileges');

    if (res.length) {
      res.forEach(({ role, privilege }) => {
        privilegesMap.map[role] = privilegesMap.map[role] || [];
        privilegesMap.map[role].push(privilege);
      })
    }

    return privilegesMap;
  }
}

export default PermissionsService;
