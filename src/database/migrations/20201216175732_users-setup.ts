import type Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<any> {
  const accounts = await knex.select('*').from('accounts');

  await knex.raw(`
    alter table "accounts" drop column "name" cascade; 
    alter table "accounts" drop column "comment"; 

    CREATE TABLE "users" (
      "id" uuid NOT NULL,
      "account" uuid NULL,
      "name" varchar(100) NOT NULL,
      "phones" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "deleted" boolean NOT NULL DEFAULT false,
      "comment" text NULL,
      CONSTRAINT users_pkey PRIMARY KEY (id)
    );
 
    CREATE INDEX "usersDeletedIndex" ON users USING btree (deleted);
    ALTER TABLE "users" ADD CONSTRAINT "usersToAccounts_fk" FOREIGN KEY (account) REFERENCES "accounts"(id) ON DELETE SET NULL;

  `);

  if (accounts.length) {

    await knex.insert(
      accounts.map((account) => ({
        id: uuidv4(),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        account: account.id,
        name: account.name,
        phones: '[]',
        deleted: account.deleted,
        comment: account.comment,
      })),
    ).into('users')
  }
}

export async function down(knex: Knex): Promise<any> {
  const users = await knex('users').select('*').whereNotNull('account');

  await knex.raw(`
    drop table if exists "users" cascade;
    alter table "accounts" add column "name" varchar(100) NOT NULL default '';
    alter table "accounts" add column "comment" text NULL;
  `);

  await users.reduce(async (prev, user) => {
    await prev;

    knex('accounts').update({
      name: user.name,
      comment: user.comment,
    }).where({
      id: user.account,
    })

  }, Promise.resolve());
}