import { withFilter, IObjectTypeResolver } from '@via-profit-services/core';

import { IAccount, SubscriptionTriggers } from '../types';


const accountsSubscription: IObjectTypeResolver = {

  // fire when account with variables.id was updated
  accountWasUpdated: {
    subscribe: withFilter(
      (parent, args, context) => context.pubsub.asyncIterator(SubscriptionTriggers.ACCOUNT_UPDATED),
      (payload: {
        accountWasUpdated: IAccount;
      }, variables: {
        id: string;
      }) => payload.accountWasUpdated.id === variables.id,
    ),
  },
  accountWasDeleted: {
    subscribe: (parent, args, context) => context.pubsub.asyncIterator(
      SubscriptionTriggers.ACCOUNT_DELETED,
    ),
  },
};

export default accountsSubscription;
