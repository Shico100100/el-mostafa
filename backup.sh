#!/bin/bash

# Configuration
DB_NAME="elmostafa_db"
DB_USER="postgres"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$DATE.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup for database: $DB_NAME..."

# Try to get password from .env if not set
if [ -z "$PGPASSWORD" ]; then
    if [ -f "./backend/.env" ]; then
        export PGPASSWORD=$(grep DATABASE_PASSWORD ./backend/.env | cut -d'=' -f2)
    fi
fi

if [ -z "$PGPASSWORD" ]; then
    echo "Warning: PGPASSWORD is not set and could not be found in .env"
fi

pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    # Keep only last 7 days of backups
    find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
