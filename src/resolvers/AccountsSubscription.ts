import { IObjectTypeResolver } from '@graphql-tools/utils';
import { withFilter, Context } from '@via-profit-services/core';


const accountsSubscription: IObjectTypeResolver = {

  // fire when account with variables.id was updated
  accountWasUpdated: {
    subscribe: withFilter(
      (parent, args, context) => context.pubsub.asyncIterator('account-updated'),
      (payload: {
        accountWasUpdated: Account;
      }, variables: {
        id: string;
      }) => payload.accountWasUpdated.id === variables.id,
    ),
  },
  accountWasDeleted: {
    subscribe: (parent: any, args: any, context: Context) => context.pubsub.asyncIterator(
      'account-deleted',
    ),
  },
};

export default accountsSubscription;
