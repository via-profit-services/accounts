import { knexExternals } from '@via-profit-services/knex/dist/webpack-utils';
import NodemonPlugin from 'nodemon-webpack-plugin';
import path from 'path';
import { Configuration, WebpackPluginInstance } from 'webpack';
import { merge } from 'webpack-merge';

import baseConfig from './webpack-config-base';

const webpackDevConfig: Configuration = merge(baseConfig, {
  entry: {
    index: path.resolve(__dirname, '../src/playground/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../build/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new NodemonPlugin({
      exec: process.env.DEBUG
        ? 'yarn node --inspect-brk=9229 ./build/index.js'
        : 'yarn node ./build/index.js',
      watch: ['./build'],
    }) as WebpackPluginInstance,
  ],
  externals: [
    ...knexExternals,
    /@via-profit-services\/core/,
    /@via-profit-services\/knex/,
    /moment/,
    /moment-timezone/,
    /uuid/,
    /winston/,
    /graphql/,
    /winston-daily-rotate-file/,
  ],
});

export default webpackDevConfig;
