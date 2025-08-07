#!/bin/bash

# Docker run script for PDF Reader Backend
set -e

echo "🐳 Running PDF Reader Backend Docker Container..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if image exists
if ! docker images pdf-reader-backend:latest | grep -q pdf-reader-backend; then
    echo "❌ Docker image 'pdf-reader-backend:latest' not found."
    echo "   Please build the image first:"
    echo "   ./docker-build.sh"
    exit 1
fi

# Set default environment variables
OPENAI_API_KEY=${OPENAI_API_KEY:-""}
GEMINI_API_KEY=${GEMINI_API_KEY:-""}
PORT=${PORT:-5002}

# Check if at least one API key is provided
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: No API keys provided. The backend will have limited functionality."
    echo "   Set environment variables:"
    echo "   export OPENAI_API_KEY=your_openai_key"
    echo "   export GEMINI_API_KEY=your_gemini_key"
    echo ""
    echo "   Or pass them directly:"
    echo "   OPENAI_API_KEY=your_key ./docker-run.sh"
    echo ""
fi

echo "🚀 Starting container on port $PORT..."

# Stop any existing container
docker stop pdf-reader-backend 2>/dev/null || true
docker rm pdf-reader-backend 2>/dev/null || true

# Run the container
docker run -d \
    --name pdf-reader-backend \
    -p $PORT:5002 \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e GEMINI_API_KEY="$GEMINI_API_KEY" \
    -e FLASK_ENV=development \
    pdf-reader-backend:latest

# Check if container started successfully
sleep 2
if docker ps | grep -q pdf-reader-backend; then
    echo "✅ Container started successfully!"
    echo ""
    echo "📋 Container info:"
    docker ps | grep pdf-reader-backend
    echo ""
    echo "🌐 Backend available at: http://localhost:$PORT"
    echo "🔍 Health check: http://localhost:$PORT/health"
    echo ""
    echo "📝 Useful commands:"
    echo "   docker logs pdf-reader-backend     # View logs"
    echo "   docker stop pdf-reader-backend     # Stop container"
    echo "   docker exec -it pdf-reader-backend bash  # SSH into container"
    echo ""
    echo "🧪 Test the backend:"
    echo "   curl http://localhost:$PORT/health"
else
    echo "❌ Container failed to start!"
    echo "📝 Check logs:"
    docker logs pdf-reader-backend
    exit 1
fi
