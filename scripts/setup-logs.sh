#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up log directories for Fluentd...${NC}"

# Remove any existing log files and position files that might cause permission issues
rm -rf logs/pos/*
# Don't delete the main log directories as they might contain data we want to keep

# Create main log directories
mkdir -p logs/gateway
mkdir -p logs/auth
mkdir -p logs/event

# Set permissions
chmod -R 777 logs

# Create empty log files to prevent permission issues
touch logs/gateway/gateway.log
touch logs/auth/auth.log
touch logs/event/event.log

# Set permissions for the log files
chmod 666 logs/gateway/gateway.log
chmod 666 logs/auth/auth.log
chmod 666 logs/event/event.log

echo -e "${GREEN}Log directories created successfully${NC}"
echo -e "Directory structure:"
find logs -type d | sort | sed 's/^/  /'

echo -e "\n${YELLOW}To start the services with Fluentd logging, run:${NC}"
echo -e "  docker-compose up -d" 
