/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import Application, { typeDefs, resolvers } from '@via-profit-services/core';

import accountsMiddleware, {
  // resolvers as accountsResolvers,
  // typeDefs as accountsTypeDefs,
} from '../index';

const schema = makeExecutableSchema({
  typeDefs: [
    typeDefs,
    // accountsTypeDefs,
  ],
  resolvers: [
    resolvers,
    // accountsResolvers,
  ],
})

const app = new Application({
  schema,
  debug: true,
  enableIntrospection: true,
  port: 9005,
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
  },
  middlewares: [
    accountsMiddleware({
      privateKey: '',
      publicKey: '',
    }),
  ],
});

app.bootstrap(({ resolveUrl }) => {
  const {
    graphql,
    subscriptions,
  } = resolveUrl;

  console.log(`GraphQL server started at ${graphql}`);
  console.log(`Subscription server started at ${subscriptions}`);
});
