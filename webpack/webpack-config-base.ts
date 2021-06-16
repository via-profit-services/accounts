import { knexExternals } from '@via-profit-services/knex/dist/webpack-utils';
import { Configuration } from 'webpack';

const webpackBaseConfig: Configuration = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.graphql$/,
        use: 'raw-loader',
      },
    ],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.graphql'],
  },
  externals: [
    ...knexExternals,
    /^@via-profit\/dataloader/,
    /^@via-profit-services\/.*/,
    /^faker$/,
    /^moment$/,
    /^moment-timezone$/,
    /^uuid$/,
    /^winston$/,
    /^graphql$/,
    /^winston-daily-rotate-file$/,
  ],
}

export default webpackBaseConfig;
