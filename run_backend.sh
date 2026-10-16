#!/bin/bash
# ==============================================================================
# Price Alerter - Web Backend Startup Script
# Starts the Flask backend & API server for web and Android clients
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/web_backend"

echo "=================================================="
echo "🛒 Price Alerter Backend Server"
echo "=================================================="

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: web_backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Check if port 8081 is already running
if lsof -i :8081 > /dev/null 2>&1; then
    echo "⚠️  Port 8081 is already active."
    echo "   Stopping previous instance..."
    PID=$(lsof -t -i :8081)
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

# Detect local IP address for physical Android testing
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo ""
echo "🚀 Starting backend server on port 8081..."
echo "--------------------------------------------------"
echo "📍 Web Browser:              http://localhost:8081"
echo "📱 Android Emulator:         http://10.0.2.2:8081"
echo "📱 Android Device (Wi-Fi):   http://$LOCAL_IP:8081"
echo "☁️  Production Server:        https://pricealerter.in"
echo "--------------------------------------------------"
echo "Press Ctrl+C to stop the server"
echo "=================================================="
echo ""

python3 app.py
