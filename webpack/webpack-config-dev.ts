import path from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import baseConfig from './webpack-config-base';

const webpackDevConfig: Configuration = merge(baseConfig, {
  entry: {
    index: path.resolve(__dirname, '../src/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../build/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'development',
  devtool: 'inline-source-map',
});

export default webpackDevConfig;
