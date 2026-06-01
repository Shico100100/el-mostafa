#!/bin/bash

echo "🚀 Starting Production Build & Deployment..."

# 1. Build Backend
echo "📦 Building Backend..."
cd backend
npm install
npm run build
cd ..

# 2. Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Start PM2
echo "🚀 Starting Services with PM2..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js
    pm2 save
    pm2 list
else
    echo "PM2 not found. Installing locally..."
    npm install pm2 -g
    pm2 start ecosystem.config.js
    pm2 save
    pm2 list
fi

echo "✅ System is running!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
