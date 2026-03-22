import type { Knex } from 'knex'

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/drama_studio',
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
}

export default config
