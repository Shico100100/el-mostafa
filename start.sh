#!/bin/bash

echo "🚀 Starting ELMostafa Factory Management System..."

# Kill any existing processes
echo "🔄 Stopping existing servers..."
pkill -f "next dev" 2>/dev/null
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null

# Start Backend
echo "🔧 Starting Backend Server (Port 3001)..."
cd backend
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
MAX_RETRIES=60
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

# Start Frontend
echo "🎨 Starting Frontend Server (Port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers Started Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👤 Login Credentials:"
echo "   Username: admin@admin.com"
echo "   Password: admin123"
echo "   Username: newadmin@example.com"
echo "   Password: newadmin123"
echo ""
echo "⚠️  Press Ctrl+C to stop all servers"
echo ""

# Wait for user to press Ctrl+C
wait
