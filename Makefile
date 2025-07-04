# Event Server Makefile
.PHONY: init up down restart logs ps k6 seed-test-users seed-docker-test generate-keys help test

# Docker Compose Files
COMPOSE_FILE=docker/docker-compose.yml
COMPOSE_K6_FILE=docker/docker-compose.k6.yml
COMPOSE_LOG_FILE=docker/docker-compose.log.yml

help:
	@echo "Available commands:"
	@echo "  make init            - Generate keys and start services"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - View logs from all services"
	@echo "  make logs-follow     - Follow logs from all services"
	@echo "  make ps              - List running services"
	@echo "  make k6              - Run k6 tests"
	@echo "  make seed-test-users - Seed test users"
	@echo "  make seed-docker-test - Seed docker test data"
	@echo "  make generate-keys   - Generate keys"

# Docker Compose Operations
init: generate-keys
	pnpm install
	pnpm build
	docker compose -f $(COMPOSE_FILE) up -d

up:
	docker compose -f $(COMPOSE_FILE) up -d

up-with-logs:
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_LOG_FILE) up -d

down:
	docker compose -f $(COMPOSE_FILE) down

restart:
	docker compose -f $(COMPOSE_FILE) restart

logs:
	docker compose -f $(COMPOSE_FILE) logs

logs-follow:
	docker compose -f $(COMPOSE_FILE) logs -f

ps:
	docker compose -f $(COMPOSE_FILE) ps

# Testing and Seeding Operations
k6: seed-k6-test
	docker compose -f ${COMPOSE_K6_FILE} up -d
	bash scripts/run-k6-tests.sh

# Run a specific k6 test with no threshold validation, useful for quick tests
# Usage: make k6-test TEST=event/event-creation-test.js
k6-test: seed-k6-test
	docker compose -f ${COMPOSE_K6_FILE} up -d
	docker compose -f ${COMPOSE_K6_FILE} run --rm k6 run /dist/$(TEST) --no-thresholds --duration=10s --vus=2

# Run all k6 tests in quick mode
k6-all: seed-k6-test
	docker compose -f ${COMPOSE_K6_FILE} up -d
	bash scripts/run-k6-tests.sh --all --duration 10s --vus 2

seed-test-users:
	bash scripts/seed-test-users.sh

seed-k6-test:
	bash scripts/seed-k6-test.sh

generate-keys:
	bash scripts/generate-keys.sh 

test: seed-test-users
	pnpm run test
	bash scripts/run-usecase-tests.sh

