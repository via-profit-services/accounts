/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import factory, { typeDefs, resolvers } from '@via-profit-services/core';
import knexMiddlewareFactory from '@via-profit-services/knex';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';

import accountsMiddlewareFactory from '../index';

dotenv.config();

const knex = knexMiddlewareFactory({
  connection: {
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  },
});


const accounts = accountsMiddlewareFactory({
  privateKey: path.resolve(__dirname, './jwtRS256.key'),
  publicKey: path.resolve(__dirname, './jwtRS256.key.pub'),
});


const PORT = 9006;
const app = express();
const server = http.createServer(app);
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


const application = factory({
  server,
  schema,
  debug: true,
  enableIntrospection: true,
  middleware: [
    knex.middleware,
    accounts.middleware,
  ],
});

app.use(application);
server.listen(PORT, () => {
  console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
  console.log(`Subscriptions server started at ws://localhost:${PORT}/graphql`);
})

