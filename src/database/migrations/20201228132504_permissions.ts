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

    DROP TABLE IF EXISTS "roles2privileges" CASCADE;
    CREATE TABLE "roles2privileges" (
      "role" varchar(100) NOT NULL,
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT "roles2privileges_un" UNIQUE (role, privilege)
    );

    ALTER TABLE "roles2privileges" ADD CONSTRAINT "roles2privileges_privilege_fk" FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE "roles2privileges" ADD CONSTRAINT "roles2privileges_role_fk" FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  

    DROP TYPE IF EXISTS "permissionsType";
    CREATE TYPE "permissionsType" AS ENUM (
      'grant',
      'restrict'
    );
    
    DROP TABLE IF EXISTS "permissions" CASCADE;
    CREATE TABLE "permissions" (
      "typeName" varchar(100) NOT NULL,
      "fieldName" varchar(100) NOT NULL,
      "type" "permissionsType" NOT NULL DEFAULT 'grant'::"permissionsType",
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT permissions_un UNIQUE ("typeName","fieldName",privilege)
    );

    ALTER TABLE "permissions" ADD CONSTRAINT "permissions_privilege_fk" FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;

    
    -- insert default roles set
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('administrator', 'Accounts have this role can make all requests without limits.');

    -- insert privileges
    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access'),
      ('user.read.phones', 'Read user phone number'),
      ('account.read.login', 'Read user login'),
      ('account.read.password', 'Read user password hash'),
      ('account.read.recoveryPhones', 'Read account recovery phones');

    -- insert roles2privileges
    insert into "roles2privileges"
      ("role", "privilege")
    values
      ('developer', '*'),
      ('administrator', '*'),
      ('viewer', 'user.read.phones'),
      ('viewer', 'account.read.login');

    -- inser permissions
    insert into "permissions"
      ("typeName", "fieldName", "type", "privilege")
    values
    ('Query', 'authentification', 'grant', '*'),
    ('Mutation', 'authentification', 'grant', '*'),
    ('TokenBag', '*', 'grant', '*'),
    ('AccessToken', '*', 'grant', '*'),
    ('RefreshToken', '*', 'grant', '*'),
    ('AccessTokenPayload', '*', 'grant', '*'),
    ('RefreshTokenPayload', '*', 'grant', '*'),
    ('TokenRegistrationError', '*', 'grant', '*'),
    ('TokenVerificationError', '*', 'grant', '*'),
    ('ResetPasswordError', '*', 'grant', '*'),
    ('ResetPasswordSuccess', '*', 'grant', '*'),
    ('AuthentificationMutation', '*', 'grant', '*'),
    ('AuthentificationQuery', '*', 'grant', '*'),
    ('Account', 'login', 'grant', 'account.read.login'),
    ('Account', 'password', 'grant', 'account.read.password'),
    ('Account', 'recoveryPhones', 'grant', 'account.read.recoveryPhones'),
    ('User', 'phones', 'grant', 'user.read.phones');
  `);

}


export async function down(knex: Knex): Promise<void> {

  return knex.raw(`
    DROP TABLE IF EXISTS "permissions" CASCADE;
    DROP TABLE IF EXISTS "roles2privileges" CASCADE;
    DROP TABLE IF EXISTS "privileges" CASCADE;
    DROP TABLE IF EXISTS "roles" CASCADE;
  `);
}

