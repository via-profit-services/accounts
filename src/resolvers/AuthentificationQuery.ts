import { Resolvers } from '@via-profit-services/accounts';

const authentificationQuery: Resolvers['AuthentificationQuery'] = {
  tokenPayload: async (_parent, _args, context) => {
    const { token } = context;

    return token;
  },
  verifyToken: async (_parent, args, context) => {
    const { token } = args;
    const { services } = context;
    const { authentification } = services;


    try {
      const tokenPayload = await authentification.verifyToken(token);

      return {
        ...tokenPayload,
        __typename: authentification.isAccessTokenPayload(tokenPayload)
          ? 'AccessTokenPayload'
          : 'RefreshTokenPayload',
      }

    } catch (err) {
        return {
          name: 'VerificationError',
          msg: err.message,
          __typename: 'TokenVerificationError',
        };
    }
  },
};

export default authentificationQuery;
