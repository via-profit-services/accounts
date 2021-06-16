/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import { factory, resolvers, ServerError, typeDefs, Context } from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import { factory as phonesFactory } from '@via-profit-services/phones';
import * as redis from '@via-profit-services/redis';
import * as sms from '@via-profit-services/sms';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { isObjectType, isIntrospectionType } from 'graphql';

import { factory as accountsFactory } from '../index';

dotenv.config();

const app = express();
const redisConfig: redis.InitialProps = {
  host: 'localhost',
  port: 6379,
  password: '',
  db: 5,
};
const server = http.createServer(app);
(async () => {

  const phones = await phonesFactory({
    entities: ['Account'],
  });

  const knexMiddleware = knex.factory({
    connection: {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
  });

  const redisMiddleware = redis.factory(redisConfig);

  const accounts = await accountsFactory({
    privateKey: path.resolve(__dirname, './jwtRS256.key'),
    publicKey: path.resolve(__dirname, './jwtRS256.key.pub'),
    accessTokenExpiresIn: 60 * 60 * 24,
    entities: ['User'],
  });

  const smsMiddleware = sms.factory({
    provider: 'smsc.ru',
    login: process.env.SMSC_LOGIN,
    password: process.env.SMSC_PASSWORD,
  });

  const customTypes = `
    extend type Query {
      propper: Propper!
    }

    type Propper {
      id: ID!
      name: String!
      token: String!
    }
  `;

  const customResolvers = {
    Query: {
      propper: () => ({}),
    },
    Propper: {
      id: () => 'propperID',
      name: (_parent: any, _args: any, context: Context) => {
        const { token } = context;
        console.log('Propper Name token', token.id);
        
        return 'Propper Name'
      },
      token: (_parent: any, _args: any, context: Context) => {
        const { token } = context;

        return `Token is «${token.id}»`;
      },
    },
  };

  const schema = makeExecutableSchema({
    typeDefs: [
      typeDefs,
      phones.typeDefs,
      customTypes,
      accounts.typeDefs,
      `type User {
        id: ID!
        name: String!
        accounts: [Account!]
      }`,
    ],
    resolvers: [
      resolvers,
      phones.resolvers,
      customResolvers,
      accounts.resolvers,
      {
        User: ({
          id: () => '68158930-f5f2-46fc-8ebb-db9e5aad5fa3',
          name: () => 'John Smith',
          accounts: () => null,
        }),
      },
    ],
  });

  // const enableIntrospection = false;
  const { graphQLExpress } = await factory({
    server,
    schema,
    debug: true,
    middleware: [
      // ({ context }) => {

      //   if (context?.token) {
      //     delete context.token;
      //   }
      //   // console.log('before --', context?.token);

      //   return { context }
      // },
      knexMiddleware,
      redisMiddleware,
      smsMiddleware,
      phones.middleware,
      ({ context }) => {
        console.log('before --', context?.token?.id);

        return { context }
      },
      accounts.middleware,
      
      // ({ context }) => {
      //   console.log('before -', context?.token?.id);

      //   return { context }
      // },
      
      ({ context }) => {
        console.log('after -', context?.token?.id);

        return { context }
      },
      // ({ context }) => {
      //   console.log('after --', context?.token?.id);

      //   return { context }
      // },
    ],
  });

  app.use(process.env.GRAPHQL_ENDPOINT, graphQLExpress); // <-- Last

  server.listen(Number(process.env.SERVER_PORT), process.env.SERVER_HOST, () => {
    console.log(`GraphQL Server started at http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/graphql`);
  });

})();
