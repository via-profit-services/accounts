import Knex from 'knex';


export async function up(knex: Knex): Promise<any> {
  return knex('accounts').insert({
    id: '40491ee1-a365-454f-b3ec-8a325ccfc371',
    name: 'Developer',
    login: 'dev',
    password: '$2a$10$bNKUriLTo8EGtAxoyJnzfuI0Njj.PFbORvGwCOOWt.9Dfi2NQmFNi',
    status: 'allowed',
    type: 'stuff',
    roles: knex.raw(`'${JSON.stringify(['developer'])}'::jsonb`),
    comment: 'Development account. Please delete this account when development is complete',
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex('accounts').del().where({
    id: '40491ee1-a365-454f-b3ec-8a325ccfc371',
  });
}
