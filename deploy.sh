#!/bin/bash

# Deploy Clockwork Banker to Raspberry Pi
# Run this script on your Raspberry Pi

set -e

echo "🤖 Deploying Clockwork Banker to Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Run: sudo apt-get update && sudo apt-get install docker-compose-plugin"
    exit 1
fi

# Create project directory
PROJECT_DIR="$HOME/clockwork-banker"
print_status "Creating project directory at $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create one from .env.template"
    if [ -f ".env.template" ]; then
        cp .env.template .env
        print_status "Created .env from template. Please edit it with your actual values."
        echo "Edit with: nano .env"
        read -p "Press Enter after you've configured your .env file..."
    else
        print_error "No .env.template found. Please create .env manually with required environment variables."
        exit 1
    fi
fi

# Create logs directory
mkdir -p logs

# Build and start the container
print_status "Building Docker image..."
docker-compose build

print_status "Starting Clockwork Banker container..."
docker-compose up -d

# Wait a moment for the container to start
sleep 5

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    print_success "Clockwork Banker is now running!"
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
    print_status "To restart: docker-compose restart"
else
    print_error "Container failed to start. Check logs with: docker-compose logs"
    exit 1
fi

print_success "Deployment completed successfully! 🎉"