import { withFilter } from '@via-profit-services/core';
import { IResolverObject } from 'graphql-tools';

import { IAccount, SubscriptionTriggers } from '../types';


const accountsSubscription: IResolverObject = {

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
