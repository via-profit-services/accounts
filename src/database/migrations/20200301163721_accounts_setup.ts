import Knex from 'knex';


export async function up(knex: Knex): Promise<any> {
  return knex.raw(`
    drop table if exists "roles2privileges" cascade;
    drop table if exists "tokens" cascade;
    drop table if exists "accountsTypes" cascade;
    drop table if exists "accounts" cascade;
    drop table if exists "privileges" cascade;
    drop table if exists "roles" cascade;
    drop table if exists "permissions" CASCADE;
    
    drop type if exists "permissionsType";
    drop type if exists "tokenType";
    drop type if exists "accountStatus";
    
    create type "accountStatus" AS ENUM (
      'allowed',
      'forbidden'
    );

    create type "tokenType" AS enum (
      'access',
      'refresh'
    );


    create type "permissionsType" AS ENUM (
      'grant',
      'restrict'
    );

    create table "tokens" (
      "type" "tokenType" NOT NULL DEFAULT 'access'::"tokenType",
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "expiredAt" timestamptz NOT NULL,
      "account" uuid NULL,
      "id" uuid NOT NULL,
      "associated" uuid NULL,
      "deviceInfo" jsonb NULL,
      CONSTRAINT tokens_pk PRIMARY KEY (id)
    );

    create table "accountsTypes" (
      "type" varchar(100) not null,
      CONSTRAINT "accountTypes_un" UNIQUE ("type")
    );

    create table "accounts" (
      "id" uuid NOT NULL,
      "login" varchar(100) NOT NULL,
      "password" varchar(255) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "status" "accountStatus" NOT NULL DEFAULT 'allowed'::"accountStatus",
      "type" varchar(50) NOT NULL DEFAULT 'User'::character varying,
      "roles" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "deleted" bool NOT NULL DEFAULT false,
      "entity" uuid NULL,
      CONSTRAINT "accounts_login_un" UNIQUE (login),
      CONSTRAINT "accounts_pkey" PRIMARY KEY (id)
    );

    create table "roles" (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT roles_pk PRIMARY KEY (name)
    );


    create table "privileges" (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT privileges_pk PRIMARY KEY (name)
    );

    create table "roles2privileges" (
      "role" varchar(100) NOT NULL,
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT "roles2privileges_un" UNIQUE (role, privilege)
    );

        
    create table "permissions" (
      "typeName" varchar(100) NOT NULL,
      "fieldName" varchar(100) NOT NULL,
      "type" "permissionsType" NOT NULL DEFAULT 'grant'::"permissionsType",
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT permissions_un UNIQUE ("typeName","fieldName",privilege)
    );



    create index "accountsDeletedIndex" ON "accounts" using btree ("deleted");
    alter table "tokens" add constraint "tokens_account_fk" foreign key ("account") references "accounts"("id") on delete cascade;
    alter table "tokens" add constraint "tokens_associated_fk" foreign key ("associated") references "tokens"("id") on delete cascade;
    alter table "accounts" add constraint "accounts_type_fk" foreign key ("type") references "accountsTypes"("type") on delete cascade;
    alter table "roles2privileges" add constraint "roles2privileges_privilege_fk" foreign key ("privilege") references "privileges"("name") on delete cascade;
    alter table "roles2privileges" add constraint "roles2privileges_role_fk" foreign key ("role") references "roles"("name") on delete cascade;
    alter table "permissions" add constraint "permissions_privilege_fk" foreign key ("privilege") references "privileges"("name") on delete cascade;
  

  

    insert into "roles"
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('administrator', 'Accounts have this role can make all requests without limits.');

    insert into "privileges"
      ("name", "description")
    values
      ('*', 'Unlimited access');

    insert into "roles2privileges"
      ("role", "privilege")
    values
      ('developer', '*'),
      ('administrator', '*');
  `);
}

export async function down(knex: Knex): Promise<any> {
  return knex.raw(`
    drop table if exists "roles2privileges" cascade;
    drop table if exists "tokens" cascade;
    drop table if exists "accountsTypes" cascade;
    drop table if exists "accounts" cascade;
    drop table if exists "privileges" cascade;
    drop table if exists "roles" cascade;
    drop table if exists "permissions" CASCADE;
    
    drop type if exists "permissionsType";
    drop type if exists "tokenType";
    drop type if exists "accountStatus";
  `);
}
