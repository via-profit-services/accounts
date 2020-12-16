import type { Context } from '@via-profit-services/core';
import { ValidationRule } from 'graphql';

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

      // const type = validationContext.getType();
      // const fieldDef = validationContext.getFieldDef();
      // const parentType = validationContext.getParentType();

      if (node.name.value === '__schema') {
        isIntrospection = true;
      }

      if (isIntrospection) {
        return;
      }

      if (token.id === defaultTokenPayload.id) {
        // eslint-disable-next-line no-console
        console.log('Invalid token')
      }

    },
  })
}


export default validationRuleMiddleware;
