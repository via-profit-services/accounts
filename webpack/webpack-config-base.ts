import { knexExternals } from '@via-profit-services/knex/dist/webpack-utils';
import { Configuration } from 'webpack';

const webpackBaseConfig: Configuration = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  resolve: {
    // .mjs needed for https://github.com/graphql/graphql-js/issues/1272
    extensions: ['.ts', '.mjs', '.js', '.json', '.gql', '.graphql'],
  },
  externals: [
    ...knexExternals,
    /^@via-profit-services\/core/,
    /^@via-profit-services\/knex/,
    /^moment$/,
    /^moment-timezone$/,
    /^uuid$/,
    /^dataloader$/,
    /^winston$/,
    /^graphql$/,
    /^winston-daily-rotate-file$/,
  ],
}

export default webpackBaseConfig;
