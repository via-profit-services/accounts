import type { Resolvers } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';

const permissionsMutation: Resolvers['PermissionsMutation'] = {
  updatePermissionsMap: async (_parent, args, context) => {
    const { id, input } = args;
    const { services, dataloader } = context;

    try {
      await services.permissions.updatePermissionsMap(id, input);
      dataloader.permissionsMap.clear(id);

      return { id };

    } catch (err) {
      throw new ServerError('Failed to update permissions map', { err });
    }
  },
};

export default permissionsMutation;
