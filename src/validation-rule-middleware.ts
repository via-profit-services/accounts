import type {
  ValidatioRuleMiddleware,
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

  const { context, configuration, permissionsMap } = props;
  const { grantToAll, restrictToAll, authorizationToAll } = configuration;
  const { token, services } = context;
  const { roles } = token;
  let isIntrospection = false;


  return (validationContext) => ({

    enter: () => {
      const type = validationContext.getType();

      // skip if is not a GraphQL type
      if (!type) {
        return undefined;
      }


      // introspection detect
      if (['__Schema!', '__Type'].includes(type.toString())) {
        isIntrospection = true;
      }

      // if is introspection query, then skip it
      if (isIntrospection) {
        return undefined;
      }

      let typeName: string;

      // if is NonNull (e.g. foo: SomeType!) then real type will be pased in ofType property
      if (isNonNullType(type) && isObjectType(type.ofType)) {
        typeName = type.ofType.name;
      }

      // if is simple type
      if (isObjectType(type)) {
        typeName = type.name;
      }

      // typeName maybe undefined
      if (typeof typeName !== 'string') {
        return undefined;
      }

      const persmissionsResolver = permissionsMap.map[typeName] || {
        grant: [],
        restrict: [],
      };
      const resolvers: PermissionResolverComposed[] = [];

      // if permission resolver does not have fields
      if ('grant' in persmissionsResolver || 'restrict' in persmissionsResolver) {
        resolvers.push(services.permissions.composePermissionResolver(persmissionsResolver));
      } else {
        // if permission resolver has fields
        Object.entries(persmissionsResolver).forEach(([_field, fieldResolver]) => {
          resolvers.push(services.permissions.composePermissionResolver(fieldResolver));
        });
      }

      // append default resolvers
      if (!resolvers.length) {
        resolvers.push({ grant: [], restrict: [] });
      }

      if (!['Query', 'Mutation', 'Subscription'].includes(typeName)) {

        if (authorizationToAll) {
          resolvers[0].grant.push('authorized');
        }

        if (grantToAll) {
          resolvers[0].grant = resolvers[0].grant.concat(grantToAll);
        }

        if (restrictToAll) {
          resolvers[0].restrict = resolvers[0].restrict.concat(restrictToAll);
        }
      }

      // validate
      resolvers.forEach((resolver) => {

        const validationResult = services.permissions.resolvePermissions({ resolver, roles });
        console.log({ typeName, resolver, roles, validationResult });
        if (!validationResult) {
          const errMessage = `Permission denied for key «${typeName}». Make sure that you have permissions for this field`;

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

      return undefined;
    },
    leave: () => {
      const type = validationContext.getType();

      if (type && type.toString() === '__Schema!') {
        isIntrospection = false;
      }
    },
  });
}


export default validationRuleMiddleware;
