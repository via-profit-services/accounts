import type {
  ValidatioRuleMiddleware,
  ResolversKeys,
  PermissionsMap,
  PermissionResolverComposed,
} from '@via-profit-services/accounts';
import {
  GraphQLError,
  BREAK,
  isObjectType,
  isNonNullType,
} from 'graphql';

import UnauthorizedError from './UnauthorizedError';


const validationRuleMiddleware: ValidatioRuleMiddleware = (props) => {

  const { context, permissionsMap } = props;
  const { token, services } = context;
  const { roles } = token;

  return (validationContext) => ({

    enter: () => {
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
            resolvers.push(services.permissions.composePermissionResolver(persmissionsResolver));
          } else {
            // if permission resolver has fields
            Object.entries(persmissionsResolver).forEach(([_field, fieldResolver]) => {
              resolvers.push(services.permissions.composePermissionResolver(fieldResolver));
            });
          }

          // validate
          resolvers.forEach((resolver) => {
            const validationResult = services.permissions.resolvePermissions({ resolver, roles });
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
  });
}


export default validationRuleMiddleware;
