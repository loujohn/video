#!/bin/sh
set -e

wait_for_db() {
  echo "Waiting for database to be ready..."
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  until node -e "
    const knex = require('knex')({
      client: 'pg',
      connection: process.env.DATABASE_URL,
      pool: { min: 0, max: 1 }
    });
    knex.raw('SELECT 1').then(() => {
      knex.destroy();
      process.exit(0);
    }).catch(() => {
      knex.destroy();
      process.exit(1);
    });
  " 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
      echo "Database is not ready after $MAX_RETRIES attempts, exiting."
      exit 1
    fi
    echo "Database not ready, retrying in 2s... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  done
  
  echo "Database is ready!"
}

wait_for_db

echo "Running database migrations..."
npx tsx node_modules/.bin/knex migrate:latest --knexfile knexfile.ts

echo "Starting application..."
node .output/server/index.mjs
