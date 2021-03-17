/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import { factory, resolvers, ServerError, typeDefs, Context } from '@via-profit-services/core';
import { factory as filesFactory } from '@via-profit-services/file-storage';
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

  const files = await filesFactory({
    hostname: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
    categories: ['Avatar'],
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
      `type User {
        id: ID!
        name: String!
        accounts: [Account!]
      }`,
    ],
    resolvers: [
      resolvers,
      phones.resolvers,
      accounts.resolvers,
      files.resolvers,
      {
        User: ({
          id: () => '68158930-f5f2-46fc-8ebb-db9e5aad5fa3',
          name: () => 'John Smith',
          accounts: () => null,
        }),
      },
    ],
  });

  const enableIntrospection = false;
  const { graphQLExpress } = await factory({
    server,
    schema,
    debug: true,
    middleware: [
      knexMiddleware,
      redisMiddleware,
      smsMiddleware,
      phones.middleware,
      accounts.middleware,
      files.fileStorageMiddleware,
      ({ schema, context }) => {
        // let permissionsMap: Record<string, string[]> = {};
        let privileges: string[] = [];;
        const types = schema.getTypeMap();
        Object.entries(types).forEach(([typeName, type]) => {

          if (isObjectType(type)) {
            const fieldMap = type.getFields();

            Object.entries(fieldMap).forEach(([fieldName, field]) => {
              const { resolve } = field;

              if (resolve) {

                field.resolve = async (parent, args, context: Context, info) => {


                  if (!enableIntrospection && isIntrospectionType(type)) {
                    throw new ServerError('Introspection locked');
                  }
                  
                  if (!privileges.length) {
                    const { services, token } = context;
                    privileges = await services.authentification.extractTokenPrivileges(token);
                  }

                  console.log(type.name, privileges)

                  return (await resolve(parent, args, context, info));
                }
              }
            });
          }
        });



        return schema;
      },
    ],
  });

  app.use(process.env.GRAPHQL_ENDPOINT, files.graphQLFilesUploadExpress); // <-- First
  app.use(files.graphQLFilesStaticExpress); // < -- Second
  app.use(process.env.GRAPHQL_ENDPOINT, graphQLExpress); // <-- Last

  server.listen(Number(process.env.SERVER_PORT), process.env.SERVER_HOST, () => {
    console.log(`GraphQL Server started at http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/graphql`);
  });

})();
