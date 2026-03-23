import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  for (const table of ['character_looks', 'scene_variants', 'prop_variants']) {
    await knex(table).where('review_status', 'draft').update({ review_status: 'pending' })
    await knex(table).where('review_status', 'in_review').update({ review_status: 'pending' })
    await knex(table).where('review_status', 'confirmed').update({ review_status: 'approved' })
    await knex.schema.alterTable(table, (t) => {
      t.string('review_status').defaultTo('pending').alter()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const table of ['character_looks', 'scene_variants', 'prop_variants']) {
    await knex(table).where('review_status', 'pending').update({ review_status: 'draft' })
    await knex(table).where('review_status', 'approved').update({ review_status: 'confirmed' })
    await knex.schema.alterTable(table, (t) => {
      t.string('review_status').defaultTo('draft').alter()
    })
  }
}
