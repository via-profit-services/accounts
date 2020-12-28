/* eslint-disable import/max-dependencies */
import type { Resolvers } from '@via-profit-services/accounts';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
import AuthentificationMutation from './AuthentificationMutation';
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
  AuthentificationMutation,
  Query,
  User,
  UsersQuery,
  TokenBag,
}

export default resolvers;
