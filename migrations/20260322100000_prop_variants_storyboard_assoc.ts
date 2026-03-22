import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prop_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('prop_id').notNullable().references('id').inTable('props').onDelete('CASCADE')
    t.string('name').notNullable()
    t.text('description')
    t.text('image_prompt')
    t.string('variant_type')
    t.integer('sort_order').defaultTo(0)
    t.boolean('is_active').defaultTo(true)
    t.timestamps(true, true)
    t.index('prop_id')
  })

  await knex.schema.createTable('storyboard_character_looks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('storyboard_id').notNullable().references('id').inTable('storyboards').onDelete('CASCADE')
    t.uuid('character_look_id').notNullable().references('id').inTable('character_looks').onDelete('CASCADE')
    t.integer('sort_order').defaultTo(0)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['storyboard_id', 'character_look_id'])
    t.index('storyboard_id')
    t.index('character_look_id')
  })

  await knex.schema.createTable('storyboard_prop_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('storyboard_id').notNullable().references('id').inTable('storyboards').onDelete('CASCADE')
    t.uuid('prop_variant_id').notNullable().references('id').inTable('prop_variants').onDelete('CASCADE')
    t.integer('sort_order').defaultTo(0)
    t.timestamp('created_at').defaultTo(knex.fn.now())
    t.unique(['storyboard_id', 'prop_variant_id'])
    t.index('storyboard_id')
    t.index('prop_variant_id')
  })

  await knex.schema.alterTable('storyboards', (t) => {
    t.uuid('scene_variant_id').references('id').inTable('scene_variants').onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('storyboards', (t) => {
    t.dropColumn('scene_variant_id')
  })
  await knex.schema.dropTableIfExists('storyboard_prop_variants')
  await knex.schema.dropTableIfExists('storyboard_character_looks')
  await knex.schema.dropTableIfExists('prop_variants')
}
