/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import Application, { typeDefs, resolvers } from '@via-profit-services/core';
import knexMiddleware from '@via-profit-services/knex';
import dotenv from 'dotenv';
import path from 'path';

import accountsMiddleware, {
  resolvers as accountsResolvers,
  typeDefs as accountsTypeDefs,
} from '../index';

dotenv.config();

const schema = makeExecutableSchema({
  typeDefs: [
    typeDefs,
    accountsTypeDefs,
  ],
  resolvers: [
    resolvers,
    accountsResolvers,
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
    knexMiddleware({
      connection: {
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
      },
    }),
    accountsMiddleware({
      privateKey: path.resolve(__dirname, './jwtRS256.key'),
      publicKey: path.resolve(__dirname, './jwtRS256.key/pub'),
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
