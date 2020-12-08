import type { Configuration } from '@via-profit-services/accounts';
import type { Middleware } from '@via-profit-services/core';

import expressMiddleware from './accounts-express-middleware';
import graphqlMiddleware from './accounts-graphql-middleware';

const middleware = (props: Configuration): Middleware => ({
  express: (middlewareProps) => expressMiddleware({ ...middlewareProps, ...props }),
  graphql: (middlewareProps) => graphqlMiddleware({ ...middlewareProps, ...props }),
});

export default middleware;
