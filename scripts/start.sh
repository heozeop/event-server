#!/bin/bash

# Start the infrastructure and services
# This script will start all the necessary components for the system

# Print colored messages
function print_message() {
  GREEN='\033[0;32m'
  NC='\033[0m' # No Color
  echo -e "${GREEN}$1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker first."
  exit 1
fi

print_message "Starting infrastructure and services..."

# Start all services with Docker Compose
print_message "Starting Docker Compose services..."
docker compose up -d

# Wait for services to be ready
print_message "Waiting for services to initialize..."
sleep 5

# Check if Loki is running
if ! curl -s http://localhost:3100/ready > /dev/null; then
  echo "Loki is not responding. Please check the logs with 'docker logs loki'."
  exit 1
fi

# Check if Grafana is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Grafana is not responding. Please check the logs with 'docker logs grafana'."
  exit 1
fi

print_message "All services are running!"
print_message "Open Grafana at http://localhost:3000 (admin/admin) to view logs"
print_message ""
print_message "To stop all services, run:"
print_message "  docker compose down" 
