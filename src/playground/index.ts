/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import { factory, resolvers, typeDefs } from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import * as permissions from '@via-profit-services/permissions';
import { factory as phonesFactory } from '@via-profit-services/phones';
import * as redis from '@via-profit-services/redis';
import * as sms from '@via-profit-services/sms';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';

import { factory as accountsFactory } from '../index';

dotenv.config();

const PORT = 9005;
const app = express();
const redisConfig: redis.InitialProps = {
  host: 'localhost',
  port: 6379,
  password: '',
  db: 5,
};
const server = http.createServer(app);
(async () => {

  const phones = phonesFactory({
    entities: ['User'],
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
    entities: ['Driver'],
  });

  const permissionsMiddleware = await permissions.factory({
    defaultAccess: 'grant',
    enableIntrospection: true,
  });

  const smsMiddleware = sms.factory({
    provider: 'smsc.ru',
    login: process.env.SMSC_LOGIN,
    password: process.env.SMSC_PASSWORD,
  });

  const schema = makeExecutableSchema({
    typeDefs: [
      typeDefs,
      phones.typeDefs,
      accounts.typeDefs,
      `type Driver {
        name: String!
      }`,
    ],
    resolvers: [
      resolvers,
      phones.resolvers,
      accounts.resolvers,
      {
        Driver: ({
          name: () => 'Driver ivan',
        }),
      },
    ],
  });


  const { graphQLExpress } = await factory({
    server,
    schema,
    debug: true,
    middleware: [
      knexMiddleware,
      redisMiddleware,
      smsMiddleware,
      phones.middleware,
      permissionsMiddleware,
      accounts.middleware, // <-- After all
      ({ context }) => {
        context.emitter.on('user-was-updated', (user) => {
          console.log('user was updated', user);
        });

        return {};
      },
    ],
  });

  app.use(graphQLExpress);
  server.listen(PORT, () => {


    console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
  })

})();
