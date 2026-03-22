import knex, { type Knex } from 'knex'

let instance: Knex | null = null

export function getDb(): Knex {
  if (!instance) {
    instance = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
      pool: {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 30_000,
        createTimeoutMillis: 30_000,
        idleTimeoutMillis: 30_000,
        reapIntervalMillis: 1_000,
        afterCreate(conn: any, done: (err: Error | null, conn: any) => void) {
          conn.query('SELECT 1', (err: Error | null) => done(err, conn))
        },
      },
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

export async function checkDbConnection(): Promise<boolean> {
  try {
    await getDb().raw('SELECT 1')
    return true
  } catch {
    return false
  }
}

export function buildUpdateData<T extends object>(
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
