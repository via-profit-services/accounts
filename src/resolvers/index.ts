import { IResolvers } from '@graphql-tools/utils';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
import Subscription from './AccountsSubscription';
import Mutation from './Mutation';
import MyAccount from './MyAccount';
import Query from './Query';
import User from './User';
import UsersQuery from './UsersQuery';

const resolvers: IResolvers = {
  Account,
  AccountsMutation,
  AccountsQuery,
  Subscription,
  Mutation,
  MyAccount,
  Query,
  User,
  UsersQuery,
}

export default resolvers;
