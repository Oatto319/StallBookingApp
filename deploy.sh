#!/bin/bash

# 🚀 Booking System - Docker Deployment Script
# Usage: ./deploy.sh [build|start|stop|restart|logs|clean]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Build the application
build() {
    print_info "Building Docker image..."
    docker-compose build
    print_success "Build completed"
}

# Start the application
start() {
    print_info "Starting services..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_info "Please edit .env file with your configuration"
    fi
    
    docker-compose up -d
    print_success "Services started"
    print_info "Application is running at http://localhost:3000"
    
    # Show logs
    echo ""
    print_info "Recent logs:"
    docker-compose logs --tail=20 app
}

# Stop the application
stop() {
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Restart the application
restart() {
    stop
    start
}

# Show logs
logs() {
    print_info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f app
}

# Clean up
clean() {
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (yes/no): " -r
    echo
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --rmi all
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Status
status() {
    print_info "Service status:"
    docker-compose ps
    echo ""
    print_info "Container stats:"
    docker stats --no-stream
}

# Main script
main() {
    check_docker
    
    case "${1:-}" in
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        clean)
            clean
            ;;
        status)
            status
            ;;
        *)
            echo "Usage: $0 {build|start|stop|restart|logs|status|clean}"
            echo ""
            echo "Commands:"
            echo "  build   - Build Docker image"
            echo "  start   - Start services"
            echo "  stop    - Stop services"
            echo "  restart - Restart services"
            echo "  logs    - Show application logs"
            echo "  status  - Show service status"
            echo "  clean   - Remove all containers and images"
            exit 1
            ;;
    esac
}

main "$@"