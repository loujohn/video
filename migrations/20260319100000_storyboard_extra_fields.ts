import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.string('camera_angle')
    t.text('sound_effects')
    t.text('notes')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('camera_angle')
    t.dropColumn('sound_effects')
    t.dropColumn('notes')
  })
}
