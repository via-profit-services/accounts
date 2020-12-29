import { Resolvers } from '@via-profit-services/accounts';

const authentificationQuery: Resolvers['AuthentificationQuery'] = {
  tokenPayload: async (_parent, _args, context) => {
    const { token } = context;

    return token;
  },
};

export default authentificationQuery;
