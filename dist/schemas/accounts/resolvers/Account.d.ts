import { IResolverObject } from 'graphql-tools';
interface IParent {
    id: string;
}
declare const accountResolver: IResolverObject<IParent, Pick<import("@via-profit-services/core").IContext, "knex" | "logger" | "timezone" | "token" | "endpoint" | "redis" | "jwt" | "pubsub">, any>;
export default accountResolver;
