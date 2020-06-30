import { TOutputFilter, IListResponse } from '@via-profit-services/core';
import { Context, IAccount, IAccountUpdateInfo, IAccountCreateInfo } from './types';
declare class Accounts {
    props: IProps;
    constructor(props: IProps);
    static getDefaultAccountData(): IAccountCreateInfo;
    prepareDataToInsert(accountInputData: Partial<IAccountCreateInfo>): Partial<IAccountCreateInfo>;
    getAccounts(filter: Partial<TOutputFilter>): Promise<IListResponse<IAccount>>;
    getAccountsByIds(ids: string[]): Promise<IAccount[]>;
    getAccount(id: string): Promise<IAccount | false>;
    getAccountByLogin(login: string): Promise<IAccount | false>;
    updateAccount(id: string, accountData: Partial<IAccountUpdateInfo>): Promise<void>;
    createAccount(accountData: Partial<IAccountCreateInfo>): Promise<string>;
    deleteAccount(id: string): Promise<void>;
}
export default Accounts;
interface IProps {
    context: Context;
}
