import type { DataLoadersCollection } from '@via-profit-services/accounts';
import type { Context } from '@via-profit-services/core';
import { DataLoader, collateForDataloader } from '@via-profit-services/core';

import AccountsService from './AccountsService';


const loaders: DataLoadersCollection = {
  accounts: null,
};

const createLoaders = (context: Context): DataLoadersCollection => {
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

export default createLoaders;
