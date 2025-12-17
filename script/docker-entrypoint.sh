#!/bin/sh
set -e

echo "Waiting for database to be ready..."

until pg_isready -h ${PGHOST:-postgres} -p ${PGPORT:-5432} -U ${PGUSER:-postgres} 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

echo "Running migrations..."
npx tsx server/migrate.ts

echo "Starting application..."
exec npm start
