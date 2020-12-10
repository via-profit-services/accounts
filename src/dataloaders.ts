import { collateForDataloader, Context, DataLoaderCollection } from '@via-profit-services/core';
import DataLoader from 'dataloader';

import AccountsService from './AccountsService';

const dataloader: Pick<DataLoaderCollection, 'accounts'> = {
  accounts: null,
}

export default (context: Context): Pick<DataLoaderCollection, 'accounts'> => {
  if (dataloader.accounts !== null) {
    return dataloader;
  }

  const service = new AccountsService({ context });
  dataloader.accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await service.getAccountsByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return dataloader
}
