import type { Resolvers } from '@via-profit-services/accounts';

const permissionsQuery: Resolvers['PermissionsQuery'] = {
  permissionsMap: (_parent, _args, context) => {
    const { services } = context;

    return {
      id: services.permissions.getActiveMapID(),
    };
  },
};

export default permissionsQuery;
