/* eslint-disable import/max-dependencies */
import type { Resolvers } from '@via-profit-services/accounts';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
import AuthentificationMutation from './AuthentificationMutation';
import AuthentificationQuery from './AuthentificationQuery';
import Mutation from './Mutation';
// import MyAccount from './MyAccount';
import Query from './Query';
import TokenBag from './TokenBag';
import User from './User';
import UsersMutation from './UsersMutation';
import UsersQuery from './UsersQuery';

const resolvers: Resolvers = {
  Account,
  AccountsMutation,
  AccountsQuery,
  Mutation,
  // MyAccount,
  AuthentificationQuery,
  AuthentificationMutation,
  Query,
  User,
  UsersMutation,
  UsersQuery,
  TokenBag,
}

export default resolvers;
