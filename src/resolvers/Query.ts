import { Resolvers } from '@via-profit-services/accounts';

const Query: Resolvers['Query'] = {
  accounts: () => ({}),
  users: () => ({}),
  permissions: () => ({}),
  authentification: () => ({}),
};

export default Query;