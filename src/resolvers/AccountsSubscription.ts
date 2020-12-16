import { IObjectTypeResolver } from '@graphql-tools/utils';
import { Context } from '@via-profit-services/core';

const accountsSubscription: IObjectTypeResolver<any, Context> = {

  // fire when account with variables.id was updated
  accountWasUpdated: {
    subscribe: (parent, args, context) => context.pubsub.asyncIterator('accountWasUpdated'),
    // resolve: (parent, args, context) => {
    //   console.log({
    //     parent, args,
    //   })

    //   return {
    //     accountWasUpdated:{
    //       id: '',
    //     },
    //   }
    // },
    // subscribe: withFilter(
    //   (parent, args, context) => context.pubsub.asyncIterator('account-updated'),
    //   (payload: {
    //     accountWasUpdated: Account;
    //   }, variables: {
    //     id: string;
    //   }) => payload.accountWasUpdated.id === variables.id,
    // ),
  },
  // accountWasDeleted: {
  //   subscribe: (parent: any, args: any, context: Context) => context.pubsub.asyncIterator(
  //     'account-deleted',
  //   ),
  // },
};

export default accountsSubscription;
