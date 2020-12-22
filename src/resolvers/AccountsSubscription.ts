import type { Resolvers } from '@via-profit-services/accounts';

const accountsSubscription: Resolvers['Subscription'] = {

  // fire when account with variables.id was updated
  accountWasUpdated: {
    subscribe: (_parent, _args, context) => context.pubsub.asyncIterator('accountWasUpdated'),
  },
};

export default accountsSubscription;
