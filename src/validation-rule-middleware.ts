import { Context, ForbiddenError } from '@via-profit-services/core';
import { ValidationRule, GraphQLError, isDefinitionNode } from 'graphql';


type ValidatioRuleMiddleware = (props: {
  context: Context;
}) => ValidationRule;


const validationRuleMiddleware: ValidatioRuleMiddleware = (props) => {

  const { context } = props;
  const { token } = context;
  let isIntrospection = false;

  return (validationContext) => ({
    Document: () => {
      isIntrospection = false;
    },
    Field: (node) => {

      // const type = validationContext.getType();
      // const fieldDef = validationContext.getFieldDef();
      // const doc = validationContext.getDocument();


      if (node.name.value === '__schema') {
        isIntrospection = true;
        // console.log('is introspection')
      }


      if (!isIntrospection) {

        // check token and block request


      }


    },
  })
}


export default validationRuleMiddleware;
