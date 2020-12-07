import { webpackMigrationsConfig } from '@via-profit-services/knex/dist/webpack-utils';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

import webpackBaseConfig from './webpack-config-base';

const config: Configuration = merge(webpackBaseConfig, webpackMigrationsConfig());

export default config;
