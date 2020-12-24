import type { Context } from '@via-profit-services/core';
import { ValidationRule } from 'graphql';

import { TOKEN_BEARER, TOKEN_BEARER_KEY } from './constants';
import UnauthorizedError from './UnauthorizedError';

type ValidatioRuleMiddleware = (props: {
  context: Context;
}) => ValidationRule;


const validationRuleMiddleware: ValidatioRuleMiddleware = (props) => {

  const { context } = props;
  const { token, services } = context;
  const defaultTokenPayload = services.accounts.getDefaultTokenPayload();

  let isIntrospection = false;

  return () => ({
    OperationDefinition: () => {
      isIntrospection = false;
    },
    Field: (node) => {

      if (node.name.value === '__schema') {
        isIntrospection = true;
      }

      if (isIntrospection) {
        return;
      }

      if (token.id === defaultTokenPayload.id) {
        throw new UnauthorizedError(
          `Invalid token. Make sure that you provide a valid Accee Token as «${TOKEN_BEARER}: XXXX» in «${TOKEN_BEARER_KEY}» header`,
        );
      }

    },
  })
}


export default validationRuleMiddleware;
