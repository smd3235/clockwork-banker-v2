#!/bin/bash

# Deploy Clockwork Banker to Raspberry Pi
# Run this script from your project directory

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

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the clockwork-banker project directory!"
    print_error "Please cd into the directory containing package.json and run again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Run: sudo apt-get update && sudo apt-get install docker-compose-plugin"
    exit 1
fi

# Check for required files
print_status "Checking for required files..."

# Check for config.js
if [ ! -f "config.js" ]; then
    print_error "config.js not found in current directory!"
    print_status "Please create config.js with your Discord bot token and Firebase configuration."
    echo "Example config.js:"
    echo "module.exports = {"
    echo "    token: 'YOUR_DISCORD_BOT_TOKEN_HERE',"
    echo "    bankChannelName: 'bank-requests',"
    echo "    bankApiUrl: 'https://thj-dnt.web.app/assets/',"
    echo "    firebase: {"
    echo "        apiKey: 'YOUR_FIREBASE_API_KEY',"
    echo "        authDomain: 'thj-dnt.firebaseapp.com',"
    echo "        projectId: 'thj-dnt',"
    echo "        storageBucket: 'thj-dnt.appspot.com',"
    echo "        messagingSenderId: '123456789',"
    echo "        appId: '1:123456789:web:abcdef123456789'"
    echo "    }"
    echo "};"
    exit 1
else
    print_success "config.js found!"
fi

# Check for .env file (if using environment variables approach)
if [ -f ".env" ]; then
    print_success ".env file found!"
else
    print_warning ".env file not found. This is OK if you're using config.js for all configuration."
fi

# Check for docker-compose.yaml
if [ ! -f "docker-compose.yaml" ] && [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yaml not found!"
    exit 1
else
    print_success "docker-compose.yaml found!"
fi

# Check for Dockerfile
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found!"
    exit 1
else
    print_success "Dockerfile found!"
fi

# Create logs directory if it doesn't exist
mkdir -p logs
print_status "Created/verified logs directory"

# Stop any existing container
print_status "Checking for existing containers..."
if docker compose ps | grep -q "clockwork-banker"; then
    print_status "Stopping existing container..."
    docker compose down
fi

# Build and start the container
print_status "Building Docker image..."
docker compose build --no-cache

print_status "Starting Clockwork Banker container..."
docker compose up -d

# Wait a moment for the container to start
print_status "Waiting for container to initialize..."
sleep 5

# Check if container is running
if docker compose ps | grep -q "Up"; then
    print_success "Clockwork Banker is now running!"
    echo ""
    print_status "Useful commands:"
    echo "  View logs:        docker compose logs -f"
    echo "  Stop bot:         docker compose down"
    echo "  Restart bot:      docker compose restart"
    echo "  View status:      docker compose ps"
    echo ""
    
    # Show initial logs
    print_status "Showing initial logs (Ctrl+C to exit):"
    docker compose logs -f --tail=50
else
    print_error "Container failed to start. Checking logs..."
    docker compose logs
    exit 1
fi

print_success "Deployment completed successfully! 🎉"
