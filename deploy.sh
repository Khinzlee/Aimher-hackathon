#!/bin/bash

# Aimher Deployment Script for Nobus
# This script helps you deploy all 3 services to Nobus

echo "==================================="
echo "Aimher Deployment to Nobus"
echo "==================================="

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Generate JWT secret if not set
echo "Generating JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database (Neon PostgreSQL)
DATABASE_URL="your-neon-connection-string-here"

# JWT Secret
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# CORS Origin
CORS_ORIGIN=http://localhost:3000

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_INFERENCE_URL=http://localhost:8000
EOF
    echo ".env file created. Please update DATABASE_URL with your Neon connection string."
else
    echo ".env file already exists."
fi

echo ""
echo "==================================="
echo "Deployment Steps:"
echo "==================================="
echo "1. Update .env file with your Neon DATABASE_URL"
echo "2. Run: docker-compose build"
echo "3. Run: docker-compose up -d"
echo "4. Check status: docker-compose ps"
echo "5. View logs: docker-compose logs -f"
echo ""
echo "Services will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:3001"
echo "- Inference: http://localhost:8000"
echo "==================================="
