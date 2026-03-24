import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('agent_conversations', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.uuid('project_id').nullable().references('id').inTable('projects').onDelete('SET NULL')
    t.string('title', 200).notNullable().defaultTo('新对话')
    t.string('skill_id', 100).notNullable().defaultTo('drama-writer')
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.timestamp('updated_at').defaultTo(knex.fn.now())
    t.index('user_id')
  })

  await knex.schema.createTable('agent_messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('conversation_id').notNullable().references('id').inTable('agent_conversations').onDelete('CASCADE')
    t.string('role', 20).notNullable()
    t.text('content').notNullable()
    t.jsonb('tool_calls').nullable()
    t.integer('sort_order').notNullable().defaultTo(0)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.index('conversation_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agent_messages')
  await knex.schema.dropTableIfExists('agent_conversations')
}
