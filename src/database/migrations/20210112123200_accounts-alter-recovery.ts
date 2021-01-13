import Knex from 'knex';


export async function up(knex: Knex): Promise<void> {

  return knex.raw(`
    -- add column
    alter table "accounts" add column "recoveryPhones" jsonb NOT NULL DEFAULT '[]'::jsonb;

    -- add default phones
    update "accounts" set "recoveryPhones"='[{"number": "9876543210", "country": "RU", "primary": true, "comfirmed": false, "description": "Phone number to recovery access. This phone number was added automatically"}]' where "recoveryPhones"='[]';
  `);
}


export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    alter table "accounts" drop column "recoveryPhones";
  `);
}

