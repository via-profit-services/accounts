/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import factory, { typeDefs, resolvers } from '@via-profit-services/core';
import knexMiddlewareFactory from '@via-profit-services/knex';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';

import accountsMiddlewareFactory, {
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
});

const { knexMiddleware } = knexMiddlewareFactory({
  connection: {
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  },
});

const { accountsMiddleware } = accountsMiddlewareFactory({
  privateKey: path.resolve(__dirname, './jwtRS256.key'),
  publicKey: path.resolve(__dirname, './jwtRS256.key.pub'),
});

const PORT = 9005;
const app = express();
const server = http.createServer();
const application = factory({
  server,
  schema,
  debug: true,
  enableIntrospection: true,
  middleware: [knexMiddleware, accountsMiddleware],
});

app.use(application);
server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}/graphql`))

