import type { Resolvers } from '@via-profit-services/accounts';
import type { Context, MiddlewareProps } from '@via-profit-services/core';

import {
  ValidationRule,
  GraphQLError,
  BREAK,
  isObjectType,
  isNonNullType,

} from 'graphql';

import UnauthorizedError from './UnauthorizedError';

type ValidatioRuleMiddleware = (props: {
  context: Context;
  config: MiddlewareProps['config'];
  permissionsMap: unknown;
}) => ValidationRule;


type PermissionRole = 'authorized' | '*' | string;
type PermissionRoles = PermissionRole[];
type PermissionResolverComposed = {
  allow: PermissionRoles;
  disallow: PermissionRoles;
}
type PermissionResolverAllowOnly = {
  allow: PermissionRoles;
}

type PermissionResolverDisallowOnly = {
  disallow: PermissionRoles;
}

type PermissionResolvers =
| PermissionResolverComposed
| PermissionResolverAllowOnly
| PermissionResolverDisallowOnly;


type PermissionResolversWithFields = Record<any, PermissionResolvers>;
type PermissionResolver = PermissionResolvers | PermissionResolversWithFields;

type ResolversKeys = keyof Resolvers;

type PermissionsMap = Record<ResolversKeys, PermissionResolver>;


const composePermissionResolver = (resolver: PermissionResolver): PermissionResolverComposed => {
  const composedResolver: PermissionResolverComposed = {
    allow: [],
    disallow: [],
  }

  if ('allow' in resolver && Array.isArray(resolver.allow)) {
    composedResolver.allow = resolver.allow;
  }

  if ('allow' in resolver && typeof resolver.allow === 'string') {
    composedResolver.allow = [resolver.allow];
  }

  if ('disallow' in resolver && Array.isArray(resolver.disallow)) {
    composedResolver.disallow = resolver.disallow;
  }

  if ('disallow' in resolver && typeof resolver.disallow === 'string') {
    composedResolver.disallow = [resolver.disallow];
  }

  return composedResolver;
}

type ResolvePermissions = {
  resolver: PermissionResolverComposed;
  roles: string[];
}

const resolvePermissions = ({ resolver, roles }: ResolvePermissions): boolean => {

  const { disallow, allow } = resolver;

  // add 'authorized' role to all
  // allow.push('authorized');

  // resolve permissions or return true if array are empty
  const needToDisallow = !disallow.length ? false : disallow.map((negative) => {

    if (negative === '*') {
      return true;
    }

    return roles.includes(negative);

  }).includes(true);

  // resolve permissions or return true if array are empty
  const needToAllow = !allow.length ? true : allow.map((positive) => {

    if (positive === '*') {
      return true;
    }

    return roles.includes(positive);

  }).includes(true);

  const result = !needToDisallow && needToAllow;

  if (!result) {

    console.log({ resolver, roles, result: !needToDisallow && needToAllow })
  }

  return result;
}

const validationRuleMiddleware: ValidatioRuleMiddleware = (props) => {

  const { context, config, permissionsMap } = props;
  const { debug } = config;
  const { token } = context;
  const { roles } = token;
  // console.log('token: ', token);
  // console.log({ roles });

  return (validationContext) => ({
    // eslint-disable-next-line arrow-body-style
    enter: (node, key, parent, path, ancestors) => {
      const type = validationContext.getType();

      if (type) {

        let typeName: ResolversKeys | string;

        if (isNonNullType(type) && isObjectType(type.ofType)) {
          typeName = type.ofType.name;
        }

        if (isObjectType(type)) {
          typeName = type.name;
        }

        if (typeName !== '' && typeName in (permissionsMap as PermissionsMap)) {
          const permissionKey = typeName as ResolversKeys;
          const persmissionsResolver = (permissionsMap as PermissionsMap)[permissionKey];
          const resolvers: PermissionResolverComposed[] = [];

          // if permission resolver does not have fields
          if ('allow' in persmissionsResolver || 'disallow' in persmissionsResolver) {
            resolvers.push(composePermissionResolver(persmissionsResolver));
          } else {
            // if permission resolver has fields
            Object.entries(persmissionsResolver).forEach(([_field, fieldResolver]) => {
              resolvers.push(composePermissionResolver(fieldResolver));
            });
          }

          // validate
          resolvers.forEach((resolver) => {
            const validationResult = resolvePermissions({ resolver, roles });
            if (!validationResult) {
              const errMessage = `Permission denied for key «${permissionKey}». Make sure that you have permissions for this field`;

              validationContext.reportError(
                new GraphQLError(
                  errMessage,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  new UnauthorizedError(errMessage),
                ),
              );

              return BREAK;
            }

            return true;
          });
        }
      }
    },
    // eslint-disable-next-line arrow-body-style
    leave: (node, key, parent, path, ancestors) => {

      return undefined;
    },
  });
}


export default validationRuleMiddleware;
