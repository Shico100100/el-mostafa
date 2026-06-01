#!/bin/bash

set -euo pipefail

# Resolve script/repo directories so the script is independent from current working directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

# Configuration
DB_NAME="elmostafa_db"
DB_USER="postgres"

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <backup_file.sql>" >&2
    exit 1
fi

INPUT_BACKUP_FILE="$1"

# Convert to absolute path if needed
if [[ "$INPUT_BACKUP_FILE" = /* ]]; then
    BACKUP_FILE="$INPUT_BACKUP_FILE"
else
    BACKUP_FILE="$REPO_DIR/$INPUT_BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found." >&2
    exit 1
fi

echo "Starting restoration of database: $DB_NAME from $BACKUP_FILE..."

# Try to get password from .env if not set
if [ -z "${PGPASSWORD:-}" ]; then
    ENV_FILE="$REPO_DIR/backend/.env"
    if [ -f "$ENV_FILE" ]; then
        # Expect: DATABASE_PASSWORD=...
        # shellcheck disable=SC2002
        PGPASSWORD="$(grep -E '^DATABASE_PASSWORD=' "$ENV_FILE" | head -n 1 | cut -d'=' -f2-)"
        export PGPASSWORD
    fi
fi

if [ -z "${PGPASSWORD:-}" ]; then
    echo "Warning: PGPASSWORD is not set and could not be found in backend/.env" >&2
fi

# Restore the database
# Connect to 'postgres' database to perform drop/create of the target database.

echo "Recreating database $DB_NAME..."
psql -U "$DB_USER" -h "localhost" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" >&2

psql -U "$DB_USER" -h "localhost" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$DB_NAME\";" >&2

echo "Restoring data from $BACKUP_FILE..."
psql -U "$DB_USER" -h "localhost" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  < "$BACKUP_FILE" >&2

echo "Restoration completed successfully!"

