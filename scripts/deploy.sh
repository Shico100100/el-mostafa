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
docker-compose exec backend node -e "
const axios = require('axios');
const jwt = require('jsonwebtoken');
const token = jwt.sign({ email: 'admin@admin.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
axios.post('http://localhost:3001/api/v1/system/seed', {}, { headers: { Authorization: 'Bearer ' + token } })
  .then(() => console.log('Seed complete'))
  .catch(err => console.error('Seed failed:', err.message));
"

echo "Deployment complete!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "API Docs: http://localhost:3001/api/docs"
