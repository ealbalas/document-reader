#!/bin/bash

# Deployment script for fly.io
set -e

echo "🚀 Starting deployment to fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ You are not logged in to fly.io. Please run:"
    echo "   flyctl auth login"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Check if app exists
if flyctl apps list | grep -q "pdf-reader-backend"; then
    echo "📱 App 'pdf-reader-backend' already exists. Deploying update..."
    flyctl deploy
else
    echo "📱 Creating new app 'pdf-reader-backend'..."
    flyctl launch --no-deploy
    
    echo "🔧 Setting up environment variables..."
    echo "Please set your environment variables:"
    echo "   flyctl secrets set OPENAI_API_KEY=your_openai_key"
    echo "   flyctl secrets set GEMINI_API_KEY=your_gemini_key"
    echo ""
    echo "After setting secrets, run: flyctl deploy"
fi

echo "✅ Deployment process completed!"
echo ""
echo "📋 Useful commands:"
echo "   flyctl status                 - Check app status"
echo "   flyctl logs                   - View logs"
echo "   flyctl open                   - Open app in browser"
echo "   flyctl secrets list           - List environment variables"
echo "   flyctl secrets set KEY=value  - Set environment variable"
