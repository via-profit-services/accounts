import path from 'path';
import NodemonPlugin from 'nodemon-webpack-plugin';
import { ProgressPlugin, Configuration, WebpackPluginInstance } from 'webpack';
import { merge } from 'webpack-merge';

import baseConfig from './webpack-config-base';

const webpackDevConfig: Configuration = merge(baseConfig, {
  entry: {
    index: path.resolve(__dirname, '../src/index.ts'),
    playground: path.resolve(__dirname, '../src/playground/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../build/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new ProgressPlugin({}),
    new NodemonPlugin({
      script: path.resolve(__dirname, '../build/playground.js'),
      watch: [path.resolve(__dirname, '../build')],
      verbose: true,
    }) as WebpackPluginInstance,
  ],
});

export default webpackDevConfig;
