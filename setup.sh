#!/bin/bash

# Soccerzone Backend Docker Setup Script
# This script sets up and runs the complete development environment

set -e

echo "🚀 Setting up Soccerzone Backend with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running:"
    echo "   - JWT_SECRET (required)"
    echo "   - SMTP_USER and SMTP_PASS for email"
    echo "   - Your crypto wallet addresses for payments"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=20

echo ""
echo "✅ Setup complete! Your Soccerzone backend is running:"
echo "   🌐 API: http://localhost:3000/api"
echo "   📚 Swagger Docs: http://localhost:3000/api/docs"
echo "   🗄️  MongoDB: mongodb://localhost:27017/soccerzone"
echo "   🔴 Redis: redis://localhost:6379"
echo ""
echo "👤 Default Admin Account:"
echo "   Email: superadmin@cvest"
echo "   Password: superadmin123"
echo ""
echo "🔧 Useful Commands:"
echo "   docker-compose logs -f          # View logs"
echo "   docker-compose restart backend  # Restart backend"
echo "   docker-compose down              # Stop all services"
echo "   docker-compose exec backend bash # Access backend container"
echo "   docker-compose exec mongodb mongosh # Access database"
echo ""
echo "📖 For more information, see README.md"