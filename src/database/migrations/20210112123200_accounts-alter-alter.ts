import Knex from 'knex';


export async function up(knex: Knex): Promise<void> {

  return knex.raw(`

  -- add column entity
    alter table "accounts" add column "entity" uuid default null;

    -- set new type for column
    alter table "accounts" alter column "type" type varchar(50) using "type"::varchar;

    -- delete type
    drop type if exists "accountType";

    update "accounts" set "type" = 'User';

  `);
}


export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    alter table "accounts" drop column "entity" cascade;
    create type "accountType" as enum (
      'stuff',
      'client'
    );
    alter table "accounts" alter column "type" type "accountType" using 'stuff'::"accountType";
  `);
}

