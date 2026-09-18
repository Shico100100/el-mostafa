#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh postgres:5432
FRESH_MARKER=/tmp/elmostafa-fresh-boot
rm -f "$FRESH_MARKER"
BOOTSTRAP_FRESH_MARKER="$FRESH_MARKER" node dist/database/bootstrap.js
if [ ! -f "$FRESH_MARKER" ]; then
  echo "Existing database detected - applying patch migrations"
  node_modules/.bin/typeorm migration:run \
    --dataSource dist/database/data-source.js
fi
node dist/main