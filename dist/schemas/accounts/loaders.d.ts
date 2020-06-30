import { Node, DataLoader } from '@via-profit-services/core';
import { IAccount, Context } from './types';
interface Loaders {
    accounts: DataLoader<string, Node<IAccount>>;
}
export default function createLoaders(context: Context): Loaders;
export {};
