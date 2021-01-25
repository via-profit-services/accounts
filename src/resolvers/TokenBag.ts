import { Resolvers } from '@via-profit-services/accounts';

const TokenBagResolver: Resolvers['TokenBag'] = {
  accessToken: (parent) => parent.accessToken,
  refreshToken: (parent) => parent.refreshToken,
};

export default TokenBagResolver;
