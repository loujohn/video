import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('character_looks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.boolean('is_base').defaultTo(false)
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('scene_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('scene_id').references('id').inTable('scenes').onDelete('CASCADE').notNullable()
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.string('variant_type')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
  })

  await knex.schema.raw('CREATE INDEX idx_character_looks_character ON character_looks(character_id)')
  await knex.schema.raw('CREATE INDEX idx_scene_variants_scene ON scene_variants(scene_id)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('scene_variants')
  await knex.schema.dropTableIfExists('character_looks')
}
