/* eslint-disable import/prefer-default-export */
import type { AccountsTableModel } from '@via-profit-services/accounts';
import bcryptjs from 'bcryptjs';
import faker from 'faker';
import type Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<any>{

  const accounts: AccountsTableModel[] = [];
  const salt = bcryptjs.genSaltSync(10);

  [...new Array(30).keys()].forEach((index) => {
    const accountID = uuidv4();
    const login = `test-${index}`;
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
      entity: '68158930-f5f2-46fc-8ebb-db9e5aad5fa3',
      deleted: false,
    });
  });

  
  await knex('accounts').del();
  await knex.raw(`insert into "accountsTypes" ("type") values ('User') on conflict do nothing;`);
  await knex<AccountsTableModel>('accounts').insert(accounts);
}