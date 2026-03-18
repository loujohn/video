import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.text('reference_image_url')
    t.string('camera_movement')
    t.string('transition_type')
  })

  await knex.schema.alterTable('assets', (t) => {
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('reference_image_url')
    t.dropColumn('camera_movement')
    t.dropColumn('transition_type')
  })

  await knex.schema.alterTable('assets', (t) => {
    t.dropColumn('created_by')
  })
}
