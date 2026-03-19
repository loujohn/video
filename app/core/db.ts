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

export function buildUpdateData<T extends Record<string, unknown>>(
  data: T,
  fields: readonly (keyof T & string)[],
): Record<string, unknown> {
  const updateData: Record<string, unknown> = { updated_at: new Date() }
  for (const field of fields) {
    if (data[field] !== undefined) {
      updateData[field as string] = data[field]
    }
  }
  return updateData
}
