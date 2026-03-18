import knex, { type Knex } from 'knex'

let instance: Knex | null = null

export function getDb(): Knex {
  if (!instance) {
    instance = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
      pool: { min: 0, max: 10 },
    })
  }
  return instance
}

export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.destroy()
    instance = null
  }
}
