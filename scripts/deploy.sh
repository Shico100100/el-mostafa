#!/bin/bash
set -e

echo "Building images..."
docker-compose build

echo "Starting services..."
docker-compose up -d

echo "Waiting for PostgreSQL..."
sleep 5

echo "Running database migrations..."
docker-compose exec backend npm run migration:run

echo "Seeding demo data..."
# Generate JWT using Node's built-in crypto (no external deps needed)
TOKEN=$(docker-compose exec backend node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ email: 'admin@admin.com', iat: Math.floor(Date.now()/1000) })).toString('base64url');
const data = header + '.' + payload;
const signature = crypto.createHmac('sha256', process.env.AUTH_JWT_SECRET || 'super-secret-jwt-change-me').update(data).digest('base64url');
console.log(data + '.' + signature);
" | tr -d '\r')

curl -s -X POST http://localhost:3001/api/v1/system/seed \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" || echo "Seed failed (may already be seeded)"

echo "Deployment complete!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "API Docs: http://localhost:3001/api/docs"
