import { collateForDataloader, Context, DataLoaderCollection } from '@via-profit-services/core';
import DataLoader from 'dataloader';

import AccountsService from './AccountsService';


export default (context: Context): Pick<DataLoaderCollection, 'accounts'> => {
  const service = new AccountsService({ context });
  const accounts = new DataLoader(async (ids: string[]) => {
    const nodes = await service.getAccountsByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return {
    accounts,
  }
}
