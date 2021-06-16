/* eslint-disable import/max-dependencies */
import type { Resolvers } from '@via-profit-services/accounts';

import Account from './Account';
import AccountsMutation from './AccountsMutation';
import AccountsQuery from './AccountsQuery';
import AuthentificationMutation from './AuthentificationMutation';
import AuthentificationQuery from './AuthentificationQuery';
import Mutation from './Mutation';
import Query from './Query';
import TokenBag from './TokenBag';

const resolvers: Resolvers = {
  Account,
  AccountsMutation,
  AccountsQuery,
  Mutation,
  AuthentificationQuery,
  AuthentificationMutation,
  Query,
  TokenBag,
}

export default resolvers;
