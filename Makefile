
# Makefile for FairMediator Development
# Enterprise-grade commands for development, testing, and deployment

.PHONY: help install dev test clean docker logs

# Default target
help:
	@echo "FairMediator Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install         - Install all dependencies"
	@echo "  make install-backend - Install backend dependencies only"
	@echo "  make install-frontend- Install frontend dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev             - Start development environment"
	@echo "  make dev-backend     - Start backend only"
	@echo "  make dev-frontend    - Start frontend only"
	@echo "  make docker-dev      - Start full Docker development environment"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-backend    - Run backend tests"
	@echo "  make test-frontend   - Run frontend tests"
	@echo "  make test-e2e        - Run E2E tests"
	@echo "  make test-coverage   - Generate coverage report"
	@echo "  make test-watch      - Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint            - Run linters"
	@echo "  make lint-fix        - Fix linting issues"
	@echo "  make security        - Run security audit"
	@echo "  make format          - Format code with Prettier"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build    - Build Docker images"
	@echo "  make docker-up       - Start Docker containers"
	@echo "  make docker-down     - Stop Docker containers"
	@echo "  make docker-logs     - View Docker logs"
	@echo "  make docker-clean    - Remove Docker containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make db-seed         - Seed database with test data"
	@echo "  make db-reset        - Reset database"
	@echo "  make db-migrate      - Run migrations"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs            - View application logs"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make update          - Update all dependencies"
	@echo ""

# ==================== Installation ====================
install:
	@echo "Installing all dependencies..."
	npm install
	cd backend && npm install
	cd frontend && npm install
	cd automation && pip install -r requirements.txt

install-backend:
	cd backend && npm install

install-frontend:
	cd frontend && npm install

# ==================== Development ====================
dev:
	@echo "Starting development environment..."
	npm run dev

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

docker-dev:
	docker-compose -f docker-compose.dev.yml up

# ==================== Testing ====================
test:
	@echo "Running all tests..."
	cd backend && npm test
	cd frontend && npm test

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

test-e2e:
	cd backend && npx playwright test

test-coverage:
	cd backend && npm test -- --coverage
	cd frontend && npm test -- --coverage

test-watch:
	cd backend && npm test -- --watch

# ==================== Code Quality ====================
lint:
	cd backend && npx eslint src/
	cd frontend && npx eslint src/

lint-fix:
	cd backend && npx eslint src/ --fix
	cd frontend && npx eslint src/ --fix

security:
	@echo "Running security audit..."
	cd backend && npm audit
	cd frontend && npm audit

format:
	cd backend && npx prettier --write "src/**/*.js"
	cd frontend && npx prettier --write "src/**/*.{js,jsx}"

# ==================== Docker ====================
docker-build:
	docker-compose -f docker-compose.dev.yml build

docker-up:
	docker-compose -f docker-compose.dev.yml up -d

docker-down:
	docker-compose -f docker-compose.dev.yml down

docker-logs:
	docker-compose -f docker-compose.dev.yml logs -f

docker-clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# ==================== Database ====================
db-seed:
	cd backend && node src/scripts/seed-data.js

db-reset:
	@echo "Resetting database..."
	cd backend && node src/scripts/reset-db.js

db-migrate:
	@echo "Running migrations..."
	cd backend && node src/scripts/migrate.js

# ==================== Utilities ====================
logs:
	tail -f backend/logs/combined.log

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/coverage
	rm -rf frontend/coverage
	rm -rf backend/dist
	rm -rf frontend/dist

update:
	@echo "Updating dependencies..."
	npm update
	cd backend && npm update
	cd frontend && npm update

# ==================== Production ====================
build:
	cd frontend && npm run build

deploy:
	@echo "Deploying to production..."
	# Add deployment commands here

# ==================== Quick Commands ====================
quick-test: test-backend
quick-start: docker-up
quick-stop: docker-down
