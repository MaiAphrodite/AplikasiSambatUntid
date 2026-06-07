#!/bin/bash
set -e

echo "Applying image_url migration to database..."

if ! docker compose ps | grep -q "postgres"; then
    echo "Error: Database container is not running."
    exit 1
fi

docker compose exec -T postgres psql -U sambat -d rant_db -c "ALTER TABLE rants ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);"

echo "Migration complete!"
