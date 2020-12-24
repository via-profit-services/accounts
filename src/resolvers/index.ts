import type { Resolvers } from '@via-profit-services/accounts';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
import Mutation from './Mutation';
import MyAccount from './MyAccount';
import Query from './Query';
import TokenBag from './TokenBag';
import User from './User';
import UsersQuery from './UsersQuery';

const resolvers: Resolvers = {
  Account,
  AccountsMutation,
  AccountsQuery,
  Mutation,
  MyAccount,
  Query,
  User,
  UsersQuery,
  TokenBag,
}

export default resolvers;
