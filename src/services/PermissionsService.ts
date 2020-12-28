import type {
  PermissionsService as PermissionsServiceInterface,
  PermissionsServiceProps,
  PermissionResolverComposed,
  PermissionResolver,
  ResolvePermissions,
  PermissionsMap,
} from '@via-profit-services/accounts';

class PermissionsService implements PermissionsServiceInterface {
  props: PermissionsServiceProps;

  public constructor(props: PermissionsServiceProps) {
    this.props = props;
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

  resolvePermissions (props: ResolvePermissions): boolean {
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

  getDefaultPermissionsMap(): PermissionsMap {
    return {
      AuthentificationMutation: {
        grant: ['*'],
      },
      TokenBag: {
        grant: ['*'],
      },
      AccessToken: {
        grant: ['*'],
      },
      RefreshToken: {
        grant: ['*'],
      },
      AccessTokenPayload: {
        grant: ['*'],
      },
      RefreshTokenPayload: {
        grant: ['*'],
      },
    }
  }
}

export default PermissionsService;
