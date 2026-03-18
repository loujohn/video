import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('characters', (t) => {
    t.text('image_prompt')
  })
  await knex.schema.alterTable('scenes', (t) => {
    t.text('image_prompt')
  })
  await knex.schema.alterTable('props', (t) => {
    t.text('image_prompt')
  })
  await knex.schema.alterTable('storyboards', (t) => {
    t.text('image_prompt')
  })
  await knex.schema.alterTable('assets', (t) => {
    t.jsonb('tags').defaultTo('[]')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('characters', (t) => {
    t.dropColumn('image_prompt')
  })
  await knex.schema.alterTable('scenes', (t) => {
    t.dropColumn('image_prompt')
  })
  await knex.schema.alterTable('props', (t) => {
    t.dropColumn('image_prompt')
  })
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('image_prompt')
  })
  await knex.schema.alterTable('assets', (t) => {
    t.dropColumn('tags')
  })
}
