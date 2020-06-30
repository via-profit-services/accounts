import { IContext } from '@via-profit-services/core';

export type Context = Pick<IContext,
'knex' | 'logger' | 'timezone' | 'token' | 'endpoint' | 'redis' | 'jwt' | 'pubsub'>;

export enum AccountStatus {
  allowed = 'allowed',
  forbidden = 'forbidden',
}

export enum SubscriptionTriggers {
  ACCOUNT_UPDATED = 'account-updated',
  ACCOUNT_DELETED = 'account-deleted',
}


export type IAccountRole = string;

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
  avatar: {id: string} | null;
  files: Array<{id: string}> | null;
}

export type IAccountTableModelOutput = Omit<IAccount,
'createdAt' | 'updatedAt' | 'roles' | 'avatar' | 'files'> & {
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  totalCount: number;
}

export type IAccountUpdateInfo = Omit<IAccount,
'id' | 'createdAt' | 'updatedAt' | 'cursor' | 'deleted' | 'roles' | 'avatar' | 'files'> & {
  updatedAt: string | Date;
  roles: string[] | string;
  deleted?: boolean;
};

export type IAccountCreateInfo = Omit<IAccount,
'id' | 'createdAt' | 'updatedAt' | 'cursor' | 'deleted' | 'roles' | 'avatar' | 'files'> & {
  id?: string;
  createdAt: string;
  updatedAt: string | Date;
  roles: string[] | string;
}

export interface IUpdateArgs {
  id: string;
  input: IAccountUpdateInfo;
}

export interface ICreateArgs {
  input: IAccountCreateInfo;
}

export interface ICheckLoginExistsArgs {
  login: string;
  skipId: string;
}
