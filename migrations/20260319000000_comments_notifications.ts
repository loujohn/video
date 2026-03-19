import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
    t.string('entity_type').notNullable()
    t.uuid('entity_id').notNullable()
    t.uuid('parent_id').references('id').inTable('comments').onDelete('CASCADE')
    t.text('content').notNullable()
    t.specificType('mentions', 'uuid[]').defaultTo('{}')
    t.string('status').defaultTo('open')
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.timestamps(true, true)
    t.index(['project_id', 'entity_type', 'entity_id'])
    t.index(['parent_id'])
    t.index(['created_by'])
  })

  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid())
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.string('type').notNullable()
    t.string('title').notNullable()
    t.text('content')
    t.string('link')
    t.boolean('is_read').defaultTo(false)
    t.string('related_entity_type')
    t.uuid('related_entity_id')
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.index(['user_id', 'is_read', 'created_at'])
    t.index(['user_id', 'created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications')
  await knex.schema.dropTableIfExists('comments')
}
