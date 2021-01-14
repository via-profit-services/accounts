import type {
  PermissionsService as PermissionsServiceInterface,
  PermissionsServiceProps,
  ResolvePermissionsProps,
  PrivilegesMap,
  PermissionsMap,
  PermissionsMapResolver,
} from '@via-profit-services/accounts';

import { AUTHORIZED_PRIVILEGE, INTROSPECTION_FIELDS } from '../constants';

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

  public mergePermissions (
    source: Record<string, PermissionsMapResolver>,
    mixin: Record<string, PermissionsMapResolver>,
  ) {
    const permissions: Record<string, PermissionsMapResolver> = {
      ...source,
    };

    Object.entries(mixin).forEach(([field, resolver]) => {
      if (!permissions[field]) {
        permissions[field] = resolver;
      }

      if (permissions[field]) {
        permissions[field].grant = permissions[field]?.grant || [];
        permissions[field].restrict = permissions[field]?.restrict || [];

        permissions[field].grant = permissions[field].grant.concat(resolver.grant || []);
        permissions[field].restrict = permissions[field].restrict.concat(resolver.restrict || []);

        permissions[field].grant = [...new Set(permissions[field].grant)];
        permissions[field].restrict = [...new Set(permissions[field].restrict)];
      }
    });

    return permissions;
  }

  public resolvePermissions (props: ResolvePermissionsProps): boolean {
    const {
      permissionsMap, privileges, fieldName, typeName, requirePrivileges,
      requireAuthorization, enableIntrospection,
    } = props;
    const { map } = permissionsMap;
    const pathWithoutField = `${typeName}.*`;
    const pathWithField = `${typeName}.${fieldName}`;

    // compose resolver
    const resolver: Required<PermissionsMapResolver> = {
      grant: [

        // append permission without field (e.g.: «MyType.*)
        ...map[pathWithoutField]?.grant || [],

        // append permission with field (e.g.: «MyType.field»)
        ...map[pathWithField]?.grant || [],

        // append any permissions
        ...requirePrivileges || [],

      ],
      restrict: [
        // append permission without field (e.g.: «MyType.*)
        ...map[pathWithoutField]?.restrict || [],

        // append permission with field (e.g.: «MyType.field»)
        ...map[pathWithField]?.restrict || [],
      ],
    };

    // append «authorized» permission
    if (requireAuthorization && !resolver.grant.includes('*')) {
      resolver.grant.push(AUTHORIZED_PRIVILEGE);
    }


    // introspection control
    if (INTROSPECTION_FIELDS.includes(pathWithField)) {
      resolver.grant = enableIntrospection ? ['*'] : [];
      resolver.restrict = !enableIntrospection ? ['*'] : [];
    }

    // correct asterisks in grant «*»
    // from grant: ['priv1', '*', 'priv2'] to grant: ['*']
    if (resolver.grant.includes('*')) {
      resolver.grant = ['*'];
    }

    // correct asterisks in restrict «*»
    // from restrict: ['priv1', '*', 'priv2'] to restrict: ['*']
    if (resolver.restrict.includes('*')) {
      resolver.restrict = ['*'];
    }

    const { restrict, grant } = resolver;

    // resolve permissions or return true if array are empty
    const needToRestrict = !restrict.length ? false : restrict.map((negative) => {

      if (negative === '*') {
        return true;
      }

      return privileges.includes(negative);

    }).includes(true);

    // resolve permissions or return true if array are empty
    const needToGrant = !grant.length ? false : grant.map((positive) => {

      if (privileges.includes('*') || positive === '*') {
        return true;
      }

      return privileges.includes(positive);

    }).every((elem) => elem);

    const result = !needToRestrict && needToGrant;

    // console.log({
    //   result,
    //   typeName: pathWithField,
    //   privileges,
    //   needToRestrict,
    //   needToGrant,
    //   resolver,
    // })

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
