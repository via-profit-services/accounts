/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import { factory, resolvers, typeDefs } from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import * as redis from '@via-profit-services/redis';
import * as sms from '@via-profit-services/sms';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';

import * as accounts from '../index';

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

  const knexMiddleware = knex.factory({
    connection: {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
  });

  const redisMiddleware = redis.factory(redisConfig);

  const accountsMiddleware = await accounts.factory({
    privateKey: path.resolve(__dirname, './jwtRS256.key'),
    publicKey: path.resolve(__dirname, './jwtRS256.key.pub'),
    accessTokenExpiresIn: 60 * 60 * 24,
    enableIntrospection: true,
    defaultAccess: 'grant',
  });

  const smsMiddleware = sms.factory({
    provider: 'smsc.ru',
    login: process.env.SMSC_LOGIN,
    password: process.env.SMSC_PASSWORD,
  });

  const schema = makeExecutableSchema({
    typeDefs: [
      typeDefs,
      accounts.typeDefs,
    ],
    resolvers: [
      resolvers,
      accounts.resolvers,
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
      accountsMiddleware, // <-- After redis and knex and sms
    ],
  });

  app.use(graphQLExpress);
  server.listen(PORT, () => {


    console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
  })

})();
