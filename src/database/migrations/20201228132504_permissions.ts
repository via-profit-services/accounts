import type Knex from 'knex';


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

    ALTER TABLE permissions ADD CONSTRAINT permissions_privilege_fk FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE permissions ADD CONSTRAINT permissions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  
  
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('authorized', 'Accounts have this role can make request only with valid authorization credentials.');

    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access');

    insert into permissions
      ("role", "privilege")
    values
      ('developer', '*');
  `);

}


export async function down(knex: Knex): Promise<void> {

  return knex.raw(`
    DROP TABLE IF EXISTS "permissions" CASCADE;
    DROP TABLE IF EXISTS "privileges" CASCADE;
    DROP TABLE IF EXISTS "roles" CASCADE;
  `);
}

