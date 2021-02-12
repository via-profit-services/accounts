/* eslint-disable import/prefer-default-export */
import type { UsersTableModel, AccountsTableModel } from '@via-profit-services/accounts';
import bcryptjs from 'bcryptjs';
import faker from 'faker';
import type Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<any>{

  const accounts: AccountsTableModel[] = [];
  const users: UsersTableModel[] = [];
  const salt = bcryptjs.genSaltSync(10);

  [...new Array(30).keys()].forEach(() => {
    const userID = uuidv4();
    const accountID = uuidv4();
    const login = faker.internet.userName();
    const password = bcryptjs.hashSync(`${login}.${login}`, salt);
    const createdAt = faker.date.past().toDateString();
    const updatedAt = faker.date.past().toDateString();

    if (accounts.find((a) => a.login === login)) {
      return;
    }

    accounts.push({
      id: accountID,
      login,
      password,
      createdAt,
      updatedAt,
      roles: '["developer"]',
      type: 'User',
      status: 'allowed',
      entity: userID,
      deleted: false,
    });

    users.push({
      id: userID,
      name: faker.name.findName(),
      createdAt,
      updatedAt,
      deleted: false,
      comment: '',
    });

  });

  await knex('accounts')
    .del()
    .whereNotIn('id', ['40491ee1-a365-454f-b3ec-8a325ccfc371']);

  await knex('users').del();

  const devUser = {
    id: uuidv4(),
    name: 'Developer',
    createdAt: faker.date.past().toDateString(),
    updatedAt: faker.date.past().toDateString(),
    deleted: false,
    comment: '',
  }

  users.push(devUser);

  await knex('accounts').update({ entity: devUser.id });
  await knex<AccountsTableModel>('accounts').insert(accounts);
  await knex<UsersTableModel>('users').insert(users);
}