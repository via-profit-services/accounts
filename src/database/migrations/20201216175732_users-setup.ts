import type Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<any> {
  const accounts = await knex.select('*').from('accounts');

  await knex.raw(`
    alter table "accounts" drop column "name" cascade; 
    alter table "accounts" drop column "comment"; 

    CREATE TABLE "users" (
      "id" uuid NOT NULL,
      "name" varchar(100) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "deleted" boolean NOT NULL DEFAULT false,
      "comment" text NULL,
      CONSTRAINT users_pkey PRIMARY KEY (id)
    );
 
    CREATE INDEX "usersDeletedIndex" ON users USING btree (deleted);

  `);

  if (accounts.length) {

    await knex.insert(
      accounts.map((account) => ({
        id: uuidv4(),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        name: account.name,
        deleted: account.deleted,
        comment: account.comment,
      })),
    ).into('users')
  }
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(`
    drop table if exists "users" cascade;
    alter table "accounts" add column "name" varchar(100) NOT NULL default '';
    alter table "accounts" add column "comment" text NULL;
  `);

}