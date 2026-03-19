import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.string('role', 20).notNullable().defaultTo('user')
    t.boolean('is_active').notNullable().defaultTo(true)
  })

  const firstUser = await knex('users').orderBy('created_at', 'asc').first()
  if (firstUser) {
    await knex('users').where({ id: firstUser.id }).update({ role: 'admin' })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('role')
    t.dropColumn('is_active')
  })
}
