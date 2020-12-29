import type { PermissionsMapResolver } from '@via-profit-services/accounts';
import { ServerError } from '@via-profit-services/core';

type Resolver = PermissionsMapResolver[keyof PermissionsMapResolver];

const permissionsMap = new Proxy<PermissionsMapResolver>({
  id: () => ({}),
  map: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  description: () => ({}),
}, {
  get: (_target, property: keyof PermissionsMapResolver) => {
    const resolver: Resolver = async (parent, _args, context) => {
      const { dataloader } = context;
      const { id } = parent;

      try {
        const permissionsMap = await dataloader.permissions.load(id);

        return permissionsMap[property];
      } catch ( err ) {
        throw new ServerError(
          `Failed to load permissions map with id «${id}»`, { id },
        )
      }
    }

    return resolver;
  },
});

export default permissionsMap;
