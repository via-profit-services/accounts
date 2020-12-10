import { IResolvers } from '@graphql-tools/utils';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
// import Subscription from './AccountsSubscription';
import Mutation from './Mutation';
import Query from './Query';

const resolvers: IResolvers = {
  Query,
  Mutation,
  // Subscription,
  AccountsQuery,
  AccountsMutation,
  Account,
}

export default resolvers;
