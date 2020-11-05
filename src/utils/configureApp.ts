/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import { IInitProps, configureLogger } from '@via-profit-services/core';
import { configureFileStorageLogger } from '@via-profit-services/file-storage';
import dotenv from 'dotenv';
import moment from 'moment-timezone';


// project root path
const rootPath = path.join(__dirname, '..', '..');

// dotenv configuration
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const fileStorageLogger = configureFileStorageLogger({
  logDir: path.resolve(rootPath, process.env.LOG),
});

const logger = configureLogger({
  logDir: path.resolve(rootPath, process.env.LOG),
  loggers: {
    fileStorage: fileStorageLogger,
  },
});

moment.tz.setDefault(process.env.TIMEZONE);

const databaseConfig: IInitProps['database'] = {
  connection: {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER,
  },
  timezone: process.env.DB_TIMEZONE,
  migrations: {
    directory: path.resolve(rootPath, process.env.DB_MIGRATIONS_DIRECTORY),
    tableName: process.env.DB_MIGRATIONS_TABLENAME,
    extension: process.env.DB_MIGRATIONS_EXTENSION,
  },
  seeds: {
    directory: path.resolve(rootPath, process.env.DB_SEEDS_DIRECTORY),
    extension: process.env.DB_SEEDS_EXTENSION,
  },
};

const jwtConfig: IInitProps['jwt'] = {
  accessTokenExpiresIn: Number(process.env.JWT_ACCESSTOKENEXPIRESIN),
  algorithm: process.env.JWT_ALGORITHM as IInitProps['jwt']['algorithm'],
  issuer: process.env.JWT_ISSUER,
  privateKey: path.resolve(rootPath, process.env.JWT_PRIVATEKEY),
  publicKey: path.resolve(rootPath, process.env.JWT_PUBLICKEY),
  refreshTokenExpiresIn: Number(process.env.JWT_REFRESHTOKENEXPIRESIN),
};

const serverConfig: IInitProps = {
  enableIntrospection: true,
  port: Number(process.env.PORT),
  debug: process.env.NODE_ENV === 'development',
  endpoint: process.env.GQL_ENDPOINT,
  subscriptionEndpoint: process.env.GQL_SUBSCRIPTIONENDPOINT,
  timezone: process.env.TIMEZONE,
  database: databaseConfig,
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: jwtConfig,
  logger,
};

const configureApp = (props?: IProps): IInitProps => {
  const { typeDefs, resolvers, expressMiddlewares } = props || {};

  return {
    ...serverConfig,
    typeDefs,
    resolvers,
    expressMiddlewares,
  };
};

interface IProps {
  typeDefs: IInitProps['typeDefs'];
  resolvers: IInitProps['resolvers'];
  expressMiddlewares?: IInitProps['expressMiddlewares'];
}

export default configureApp;
export { configureApp };
