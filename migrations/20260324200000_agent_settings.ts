import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('agent_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.string('provider', 50).notNullable().defaultTo('openai')
    t.string('model', 100).notNullable().defaultTo('gpt-4o')
    t.text('api_key_encrypted').nullable()
    t.string('base_url', 500).nullable()
    t.decimal('temperature', 3, 2).notNullable().defaultTo(0.7)
    t.integer('max_tokens').notNullable().defaultTo(4096)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agent_settings')
}
