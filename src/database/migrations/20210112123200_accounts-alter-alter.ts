import Knex from 'knex';


export async function up(knex: Knex): Promise<void> {

  return knex.raw(`

    -- create types table
    drop table if exists "accountsTypes" cascade;
    create table "accountsTypes" (
      "type" varchar(100) not null,
      CONSTRAINT "accountTypes_un" UNIQUE ("type")
    );

    insert into "accountsTypes"
      ("type")
    values
      ('User')
    on conflict ("type") do nothing;



    -- add column entity
    alter table "accounts" add column "entity" uuid default null;
    alter table "accounts" alter column "type" type varchar(50) using "type"::varchar;
    alter table "accounts" alter column "type" set default 'User';
    update "accounts" set "type" = 'User';

    alter table "accounts" add constraint "accounts_type_fk" foreign key ("type") references "accountsTypes"("type") on delete cascade;

    -- delete type
    drop type if exists "accountType";


    -- set unique login
    alter table "accounts" add constraint "accounts_login_un" unique ("login");

    -- link accounts and users
    update
      "accounts"
    set
      "type" = 'User',
      "entity" = (
        select id from users where "name" ='Developer' or "comment" ilike 'Development account%'
      )
    where id = '40491ee1-a365-454f-b3ec-8a325ccfc371';

    delete from "accounts" where "entity" is null;
    
    alter table "accounts" alter column "entity" set not null;

  `);
}


export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    alter table "accounts" drop constraint "accounts_type_fk";
    alter table "accounts" alter column "type" drop default;
    alter table "accounts" drop column "entity" cascade;
    create type "accountType" as enum (
      'stuff',
      'client'
    );
    alter table "accounts" alter column "type" type "accountType" using 'stuff'::"accountType";
    alter table "accounts" alter column "type" set default 'stuff'::"accountType";
    alter table "accounts" drop constraint "accounts_login_un";
  `);
}

