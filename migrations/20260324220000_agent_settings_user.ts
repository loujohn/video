import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('agent_settings', 'user_id')
  if (!hasColumn) {
    await knex.schema.alterTable('agent_settings', (t) => {
      t.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      t.index('user_id')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('agent_settings', 'user_id')
  if (hasColumn) {
    await knex.schema.alterTable('agent_settings', (t) => {
      t.dropColumn('user_id')
    })
  }
}
