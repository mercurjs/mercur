#!/bin/bash

# Mercur Backend Deployment Script for Dokploy
# This script helps with common deployment tasks

set -e

echo "🚀 Mercur Backend Deployment Script"
echo "=================================="

# Function to check if .env.production exists
check_env_file() {
    if [ ! -f ".env.production" ]; then
        echo "❌ .env.production file not found!"
        echo "Please copy .env.production.template to .env.production and configure your production variables."
        exit 1
    fi
    echo "✅ Production environment file found"
}

# Function to validate Docker and Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed or not in PATH"
        exit 1
    fi
    echo "✅ Docker and Docker Compose are available"
}

# Function to build and start services
deploy() {
    echo "🔨 Building Docker images..."
    docker-compose --env-file .env.production build --no-cache

    echo "🚀 Starting services..."
    docker-compose --env-file .env.production up -d

    echo "📊 Checking service health..."
    sleep 10
    docker-compose --env-file .env.production ps

    echo "✅ Deployment complete!"
    echo "Backend URL: http://localhost:9000"
    echo "Admin Dashboard: http://localhost:9000/app"
}

# Function to stop services
stop() {
    echo "🛑 Stopping services..."
    docker-compose --env-file .env.production down
    echo "✅ Services stopped"
}

# Function to view logs
logs() {
    docker-compose --env-file .env.production logs -f
}

# Function to restart services
restart() {
    stop
    deploy
}

# Function to run database migrations
migrate() {
    echo "🗃️ Running database migrations..."
    docker-compose --env-file .env.production exec backend yarn db:migrate
    echo "✅ Migrations complete"
}

# Function to show help
show_help() {
    echo "Usage: $0 {deploy|stop|restart|logs|migrate|help}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Build and start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show and follow service logs"
    echo "  migrate  - Run database migrations"
    echo "  help     - Show this help message"
}

# Main script logic
case "$1" in
    deploy)
        check_docker
        check_env_file
        deploy
        ;;
    stop)
        check_docker
        stop
        ;;
    restart)
        check_docker
        check_env_file
        restart
        ;;
    logs)
        check_docker
        logs
        ;;
    migrate)
        check_docker
        migrate
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Invalid command: $1"
        show_help
        exit 1
        ;;
esac
