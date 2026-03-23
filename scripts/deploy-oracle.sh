#!/bin/bash

# ==============================================================================
# Oracle Cloud Deployment Script
# ==============================================================================
# Automates deployment of FairMediator to Oracle Cloud Always Free instance
#
# Usage:
#   ./scripts/deploy-oracle.sh [pull|restart|logs|status]
#
# Commands:
#   pull     - Pull latest code and Docker images (full deployment)
#   restart  - Restart containers without pulling updates
#   logs     - View container logs
#   status   - Check container and resource status
#
# Requirements:
#   - Git repository cloned to ~/fairmediator.ai or ~/FairMediator
#   - Docker and Docker Compose installed
#   - .env file configured with production secrets
#   - GitHub Container Registry access configured
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${HOME}/fairmediator.ai"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="${HOME}/FairMediator"
fi

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

# Functions
log_info() {
  echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if we're in the app directory
check_app_dir() {
  if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory not found: $APP_DIR"
    log_info "Please clone the repository to ~/fairmediator.ai or ~/FairMediator"
    exit 1
  fi

  cd "$APP_DIR"
  log_success "Working directory: $APP_DIR"
}

# Pull latest code and images
deploy_pull() {
  log_info "Starting full deployment..."

  # Pull latest code
  log_info "Pulling latest code from GitHub..."
  git fetch origin
  git reset --hard origin/main
  log_success "Code updated"

  # Pull Docker images
  log_info "Pulling latest Docker images from GHCR..."
  docker compose $COMPOSE_FILES pull
  log_success "Images pulled"

  # Stop containers
  log_info "Stopping containers..."
  docker compose $COMPOSE_FILES down
  log_success "Containers stopped"

  # Start containers
  log_info "Starting containers..."
  docker compose $COMPOSE_FILES up -d --remove-orphans
  log_success "Containers started"

  # Wait for services to be ready
  log_info "Waiting for services to be healthy..."
  sleep 10

  # Show status
  deploy_status

  log_success "Deployment complete! 🚀"
}

# Restart containers without pulling
deploy_restart() {
  log_info "Restarting containers..."

  docker compose $COMPOSE_FILES restart

  log_success "Containers restarted"
  sleep 5
  deploy_status
}

# View logs
deploy_logs() {
  log_info "Showing container logs (Ctrl+C to exit)..."
  docker compose $COMPOSE_FILES logs -f --tail=100
}

# Check status
deploy_status() {
  log_info "Container Status:"
  docker compose $COMPOSE_FILES ps

  echo ""
  log_info "Health Checks:"

  # Check backend
  BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health || echo "000")
  if [ "$BACKEND_STATUS" = "200" ]; then
    log_success "Backend: Healthy (HTTP $BACKEND_STATUS)"
  else
    log_error "Backend: Unhealthy (HTTP $BACKEND_STATUS)"
  fi

  # Check frontend
  FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4010 || echo "000")
  if [ "$FRONTEND_STATUS" = "200" ]; then
    log_success "Frontend: Healthy (HTTP $FRONTEND_STATUS)"
  else
    log_error "Frontend: Unhealthy (HTTP $FRONTEND_STATUS)"
  fi

  echo ""
  log_info "Resource Usage:"
  docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Cleanup old resources
deploy_cleanup() {
  log_info "Cleaning up old Docker resources..."

  # Remove stopped containers
  docker container prune -f

  # Remove dangling images
  docker image prune -f

  # Remove unused volumes (be careful!)
  log_warning "Skipping volume cleanup (use 'docker volume prune' manually if needed)"

  log_success "Cleanup complete"
}

# Main command handler
case "${1:-help}" in
  pull)
    check_app_dir
    deploy_pull
    ;;
  restart)
    check_app_dir
    deploy_restart
    ;;
  logs)
    check_app_dir
    deploy_logs
    ;;
  status)
    check_app_dir
    deploy_status
    ;;
  cleanup)
    check_app_dir
    deploy_cleanup
    ;;
  help|*)
    echo "Oracle Cloud Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  pull     - Pull latest code and Docker images (full deployment)"
    echo "  restart  - Restart containers without pulling updates"
    echo "  logs     - View container logs (live tail)"
    echo "  status   - Check container and resource status"
    echo "  cleanup  - Clean up old Docker resources"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 pull      # Deploy latest version"
    echo "  $0 status    # Check if everything is running"
    echo "  $0 logs      # Monitor application logs"
    ;;
esac
