import { Node, DataLoader, collateForDataloader } from '@via-profit-services/core';

import AccountsService from './service';
import { IAccount, Context } from './types';

interface Loaders {
  accounts: DataLoader<string, Node<IAccount>>;
}

const loaders: Loaders = {
  accounts: null,
};

export default function createLoaders(context: Context) {
  if (loaders.accounts !== null) {
    return loaders;
  }

  const service = new AccountsService({ context });

  loaders.accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await service.getAccountsByIds(ids);
    return collateForDataloader(ids, nodes);
  });

  return loaders;
}
