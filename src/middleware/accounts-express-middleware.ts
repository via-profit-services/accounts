import { Configuration } from '@via-profit-services/accounts';
import { ExpressMiddlewareFactoryProps, ExpressMiddleware } from '@via-profit-services/core';
import { Router } from 'express';

type AccountsContextMiddleware = (
  props: ExpressMiddlewareFactoryProps & Configuration,
) => ExpressMiddleware;

const accountsExpressMiddleware: AccountsContextMiddleware = () => {
  const router = Router();
  router.get('/auth/get-access-token', (req, res) => {

    res.send({ foo: 'bar' });
  })

  return router;
}


export default accountsExpressMiddleware;
