import type { ValidatioRuleMiddleware } from '@via-profit-services/accounts';
import { GraphQLError, BREAK } from 'graphql';

import { ACCESS_TOKEN_EMPTY_ID, AUTHORIZED_PRIVILEGE } from './constants';

const validationRuleMiddleware: ValidatioRuleMiddleware = async (props) => {
  const { context, configuration, config } = props;
  const {
    defaultPermissions, requireAuthorization, enableIntrospection,
    defaultAccess,
  } = configuration;
  const { token, services, dataloader, logger } = context;
  const { debug } = config;


  const privilegesMap = await dataloader.privilegesMaps.load('common');
  const permissionsMap = await dataloader.permissionsMap.load('common');

  // merge permissions
  if (defaultPermissions) {
    permissionsMap.map = services.permissions.mergePermissions(
      permissionsMap.map,
      defaultPermissions,
    );
  }

  // compose privileges list by privilegesMap
  const privileges = token.roles.reduce<string[]>((prev, role) => {
    const list = privilegesMap.map[role] || [];

    return prev.concat(list);
  }, []);

  // add «authorized» privilege if user already authorized
  if (token.id !== ACCESS_TOKEN_EMPTY_ID) {
    privileges.push(AUTHORIZED_PRIVILEGE);
  }

  let isIntrospection = false;

  return (validationContext) => ({
    enter: (node) => {
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

      const typeName = type.toString().replace(/[![\]]/gmi, '');


      if (node && node.kind === 'SelectionSet') {
        node.selections.forEach((selectionNode) => {
          if (selectionNode.kind === 'Field') {
            const fieldName = selectionNode.name.value;
            const validationResult = services.permissions.resolvePermissions({
              permissionsMap,
              privileges,
              typeName,
              fieldName,
              defaultPermissions,
              requireAuthorization,
              enableIntrospection,
              defaultAccess,
            });

            if (!validationResult) {
              const errMessage = `Permission denied for key «${typeName}.${fieldName}». Make sure that you have permissions for this field${debug ? `. Your privileges: ${privileges.join('; ')}` : '.'}`;

              logger.auth.info(errMessage);
              validationContext.reportError(
                new GraphQLError(errMessage),
              );

              return BREAK;
            }
          }

          return undefined;
        });
      }

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
