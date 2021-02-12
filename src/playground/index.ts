/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import { factory, resolvers, typeDefs } from '@via-profit-services/core';
import * as files from '@via-profit-services/file-storage';
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
    entities: ['User', 'Account'],
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

  const {
    fileStorageMiddleware,
    graphQLFilesStaticExpress,
    graphQLFilesUploadExpress,
  } = files.factory({
    hostname: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
  });

  const permissionsMiddleware = await permissions.factory({
    defaultAccess: 'grant',
    enableIntrospection: true,
    permissions: {
      'Mutation.phones': { grant: ['*'] },
      'Query.phones': { grant: ['*'] },
      'User.*': { grant: ['*'] },
      'Account.*': { grant: ['*'] },
      'Phone.*': { grant: ['*'] },
      'PhoneInputCreate.*': { grant: ['*'] },
      'PhoneInputUpdate.*': { grant: ['*'] },
      'PhonesMutation.*': { grant: ['*'] },
      'PhonesQuery.*': { grant: ['*'] },
      'PhoneListConnection.*': { grant: ['*'] },
      'PhonesEdge.*': { grant: ['*'] },
    },
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
      files.typeDefs,
      `type Driver {
        name: String!
      }`,
    ],
    resolvers: [
      resolvers,
      phones.resolvers,
      accounts.resolvers,
      files.resolvers,
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
      fileStorageMiddleware,
    ],
  });

  app.use(process.env.GRAPHQL_ENDPOINT, graphQLFilesUploadExpress); // <-- First
  app.use(graphQLFilesStaticExpress); // < -- Second
  app.use(process.env.GRAPHQL_ENDPOINT, graphQLExpress); // <-- Last

  server.listen(Number(process.env.SERVER_PORT), process.env.SERVER_HOST, () => {


    console.log(`GraphQL Server started at http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/graphql`);
  })

})();
