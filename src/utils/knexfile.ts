import { Knex } from '@via-profit-services/knex';
import dotenv from 'dotenv';

const env = dotenv.config().parsed as NodeJS.ProcessEnv;

const config: Knex.Config = {
  client: 'pg',
  connection: {
    user: env.DB_USER,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    host: env.DB_HOST,
  },
  seeds: {
    directory: './seeds',
  },
  migrations: {
    directory: './migrations',
  },
};

export default config;
