#!/bin/bash

echo "🚀 Starting ELMostafa Factory Management System..."

# Detect local network IP
NETWORK_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+\.\d+\.\d+\.\d+' | grep -v '127.0.0.1' | head -1)
if [ -z "$NETWORK_IP" ]; then NETWORK_IP="localhost"; fi

# Kill any existing processes
echo "🔄 Stopping existing servers..."
pkill -f "next dev" 2>/dev/null
pkill -f "node dist/main" 2>/dev/null
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null

# Build backend (compile TypeScript once)
echo "🔨 Building Backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed."
    exit 1
fi
echo "✅ Backend built successfully."
echo ""

# Start Backend (pre-built, no compilation needed)
echo "🔧 Starting Backend Server (Port 3001)..."
FRONTEND_DOMAIN="http://localhost:3000,http://${NETWORK_IP}:3000" npm run start:prod &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
MAX_RETRIES=30
COUNT=0
while ! netstat -tuln | grep -q ":3001 "; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo ""
        echo "❌ Backend failed to start within $MAX_RETRIES seconds."
        echo "Check backend logs for details."
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    echo -n "."
done
echo ""
echo "✅ Backend is ready!"

# Start Frontend (bind to all interfaces)
echo "🎨 Starting Frontend Server (Port 3000)..."
cd ../frontend
HOSTNAME=0.0.0.0 npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers Started Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Local:     http://localhost:3000"
if [ "$NETWORK_IP" != "localhost" ]; then
    echo "🌐 Network:   http://${NETWORK_IP}:3000"
fi
echo "🔌 Backend:  http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👤 Login Credentials:"
echo "   Username: admin@admin.com"
echo "   Password: admin123"
echo "   Username: newadmin@example.com"
echo "   Password: newadmin123"
echo ""
echo "⚠️  From another PC on your network, open: http://${NETWORK_IP}:3000"
echo "⚠️  Make sure your firewall allows inbound connections on ports 3000 and 3001"
echo ""
echo "⚠️  Press Ctrl+C to stop all servers"
echo ""

# Wait for user to press Ctrl+C
wait
