#!/bin/bash

# Docker build script for PDF Reader Backend
set -e

echo "🐳 Building PDF Reader Backend Docker Image..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    echo "   Download Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t pdf-reader-backend:latest .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "📋 Image details:"
    docker images pdf-reader-backend:latest
    echo ""
    echo "🚀 To run locally:"
    echo "   docker run -p 5002:5002 -e OPENAI_API_KEY=your_key pdf-reader-backend:latest"
    echo ""
    echo "🏷️  To tag for registry:"
    echo "   docker tag pdf-reader-backend:latest your-registry/pdf-reader-backend:latest"
    echo ""
    echo "📤 To push to registry:"
    echo "   docker push your-registry/pdf-reader-backend:latest"
else
    echo "❌ Docker build failed!"
    exit 1
fi
