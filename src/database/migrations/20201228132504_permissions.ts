import type Knex from 'knex';

import { DEFAULT_PERMISSIONS_MAP_ID, RECOVERY_PERMISSIONS_MAP_ID, DEFAULT_PERMISSIONS_MAP } from '../../constants';


export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TABLE IF EXISTS roles CASCADE;

    CREATE TABLE roles (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT roles_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "privileges" CASCADE;
      CREATE TABLE "privileges" (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT privileges_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "permissions" CASCADE;
    CREATE TABLE "permissions" (
      "role" varchar(100) NOT NULL,
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT permissions_un UNIQUE (role, privilege)
    );

    DROP TABLE IF EXISTS "permissionsMap" CASCADE;
    CREATE TABLE "permissionsMap" (
      "id" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "map" jsonb default '{}',
      "description" text,
      CONSTRAINT "permissionsMap_pk" PRIMARY KEY (id)
    );

    ALTER TABLE permissions ADD CONSTRAINT permissions_privilege_fk FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE permissions ADD CONSTRAINT permissions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  
    -- insert default roles set
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('administrator', 'Accounts have this role can make all requests without limits.');

    -- insert Unlimited access privilege
    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access');

    -- insert permission
    insert into permissions
      ("role", "privilege")
    values
      ('developer', '*'),
      ('administrator', '*');

    -- insert permissions map
    insert into "permissionsMap"
      ("id", "map", "description")
    values
      ('${RECOVERY_PERMISSIONS_MAP_ID}', '${JSON.stringify(DEFAULT_PERMISSIONS_MAP)}', 'Recovery map. Do not change this map, so that you can always return the map in case of incorrect editing'),
      ('${DEFAULT_PERMISSIONS_MAP_ID}', '${JSON.stringify(DEFAULT_PERMISSIONS_MAP)}', 'Standard map');
  `);

}


export async function down(knex: Knex): Promise<void> {

  return knex.raw(`
    DROP TABLE IF EXISTS "permissions" CASCADE;
    DROP TABLE IF EXISTS "privileges" CASCADE;
    DROP TABLE IF EXISTS "roles" CASCADE;
    DROP TABLE IF EXISTS "permissionsMap" CASCADE;
  `);
}

