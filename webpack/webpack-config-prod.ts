/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ProgressPlugin, BannerPlugin, Configuration, Compiler } from 'webpack';
import { merge } from 'webpack-merge';
import ViaProfitPlugin from '@via-profit-services/core/dist/webpack-plugin';

import packageInfo from '../package.json';
import webpackBaseConfig from './webpack-config-base';

const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
  entry: {
    index: path.resolve(__dirname, '../src/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'production',
  plugins: [
    new ProgressPlugin({}),
    new ViaProfitPlugin(),
    new BannerPlugin({
      banner: `
 Via Profit services / Accounts

Repository ${packageInfo.repository.url}
Contact    ${packageInfo.support}
      `,
    }),
    {
      apply: (compiler: Compiler) => {
        compiler.hooks.beforeCompile.tapAsync('WebpackBeforeComple', (_, callback) => {
          fs.rmSync(path.resolve(__dirname, '../dist/'), {
            recursive: true,
          });
          callback();
        }),
        compiler.hooks.afterEmit.tapAsync('WebpackAfterBuild', (_, callback) => {
          console.log('');
          console.log(chalk.green('Copy migrations'));
          fs.rmSync(path.resolve(__dirname, '../dist/database/migrations/'), {
            recursive: true,
          });
          fs.mkdirSync(path.resolve(__dirname, '../dist/database/migrations/'));

          fs.copyFileSync(
            path.resolve(__dirname, '../src/database/migrations/00000000000001_accounts-setup.ts'),
            path.resolve(__dirname, '../dist/database/migrations/00000000000001_accounts-setup.ts'),
          )

          fs.copyFileSync(
            path.resolve(__dirname, '../src/database/migrations/00000000000002_tokens-setup.ts'),
            path.resolve(__dirname, '../dist/database/migrations/00000000000002_tokens-setup.ts'),
          )

          fs.copyFileSync(
            path.resolve(__dirname, '../src/database/migrations/00000000000003_create-dev-account.ts'),
            path.resolve(__dirname, '../dist/database/migrations/00000000000003_create-dev-account.ts'),
          )

          console.log(chalk.green('Cleaning'));
          fs.rmSync(path.resolve(__dirname, '../dist/playground'), {
            recursive: true,
          });
          callback();
        });
      },
    },
    // new FileManagerPlugin({
    //   onStart: {
    //     delete: ['./dist'],
    //   },
    //   onEnd: {
    //     copy: [
    //       {
    //         source: './src/database/migrations/*',
    //         destination: './dist/database/migrations/',
    //       },
    //       {
    //         source: './src/database/seeds/*',
    //         destination: './dist/database/seeds/',
    //       },
    //     ],
    //     delete: [
    //       './dist/playground',
    //       './dist/database/migrations/!(+([0-9])_accounts-*@(.ts|.d.ts))',
    //     ],
    //   },
    // }),
  ],

  externals: {
    '@via-profit-services/core': {
      commonjs2: '@via-profit-services/core',
    },
    '@via-profit-services/file-storage': {
      commonjs2: '@via-profit-services/file-storage',
    },
    moment: {
      commonjs2: 'moment',
    },
    'moment-timezone': {
      commonjs2: 'moment-timezone',
    },
    uuid: {
      commonjs2: 'uuid',
    },
  },
});

export default webpackProdConfig;
