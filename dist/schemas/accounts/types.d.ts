import { IContext } from '@via-profit-services/core';
export declare type Context = Pick<IContext, 'knex' | 'logger' | 'timezone' | 'token' | 'endpoint' | 'redis' | 'jwt' | 'pubsub'>;
export declare enum AccountStatus {
    allowed = "allowed",
    forbidden = "forbidden"
}
export declare enum SubscriptionTriggers {
    ACCOUNT_UPDATED = "account-updated",
    ACCOUNT_DELETED = "account-deleted"
}
export declare type IAccountRole = string;
export interface IAccount {
    id: string;
    name: string;
    login: string;
    password: string;
    status: AccountStatus;
    roles: IAccountRole[];
    createdAt: Date;
    updatedAt: Date;
    deleted: Boolean;
}
export declare type IAccountTableModelOutput = Omit<IAccount, 'createdAt' | 'updatedAt' | 'roles'> & {
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
    totalCount: number;
};
export declare type IAccountUpdateInfo = Omit<IAccount, 'id' | 'createdAt' | 'updatedAt' | 'cursor' | 'deleted' | 'roles'> & {
    updatedAt: string | Date;
    roles: string[] | string;
    deleted?: boolean;
};
export declare type IAccountCreateInfo = Omit<IAccount, 'id' | 'createdAt' | 'updatedAt' | 'cursor' | 'deleted' | 'roles'> & {
    id?: string;
    createdAt: string;
    updatedAt: string | Date;
    roles: string[] | string;
};
export interface IUpdateArgs {
    id: string;
    input: IAccountUpdateInfo;
}
export interface ICreateArgs {
    input: IAccountCreateInfo;
}
