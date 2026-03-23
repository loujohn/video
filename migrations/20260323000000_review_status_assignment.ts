import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('character_looks', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('scene_variants', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('prop_variants', (t) => {
    t.string('review_status').defaultTo('draft')
  })
  await knex.schema.alterTable('characters', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('scenes', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('props', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('storyboards', (t) => {
    t.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('props', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('scenes', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('characters', (t) => { t.dropColumn('assigned_to') })
  await knex.schema.alterTable('prop_variants', (t) => { t.dropColumn('review_status') })
  await knex.schema.alterTable('scene_variants', (t) => { t.dropColumn('review_status') })
  await knex.schema.alterTable('character_looks', (t) => { t.dropColumn('review_status') })
}
