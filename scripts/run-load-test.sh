#!/bin/bash

# Script to run k6 load tests for event-server

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Please install k6 from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DIR="$PROJECT_ROOT/test"
SCRIPTS_DIR="$TEST_DIR/scripts"
DATA_DIR="$TEST_DIR/data"

# Generate test data if it doesn't exist
if [ ! -f "$DATA_DIR/users.json" ] || [ ! -f "$DATA_DIR/events.json" ]; then
    echo -e "${YELLOW}Generating test data...${NC}"
    # Check if ts-node is installed
    if ! command -v ts-node &> /dev/null; then
        echo -e "${YELLOW}Installing ts-node...${NC}"
        npm install -g ts-node typescript
    fi
    
    # Run the fixtures script
    cd "$PROJECT_ROOT"
    ts-node "$TEST_DIR/fixtures.ts"
fi

# Function to run a single test
run_test() {
    local test_path="$1"
    local test_name=$(basename "$test_path" .ts)
    
    echo -e "${YELLOW}Running test: $test_name${NC}"
    
    # Get the server URL from environment variable or use default
    local api_url=${API_URL:-http://localhost:3000/api}
    
    # Run the test with k6
    k6 run \
      --env BASE_URL="$api_url" \
      --env ADMIN_EMAIL="admin@example.com" \
      --env ADMIN_PASSWORD="Admin123!" \
      "$test_path"
    
    echo -e "${GREEN}Completed test: $test_name${NC}"
}

# Function to run all tests
run_all_tests() {
    echo -e "${YELLOW}Running all load tests...${NC}"
    
    # Auth tests
    for test in "$SCRIPTS_DIR/auth"/*.ts; do
        run_test "$test"
    done
    
    # Event tests
    for test in "$SCRIPTS_DIR/event"/*.ts; do
        run_test "$test"
    done
    
    echo -e "${GREEN}All tests completed${NC}"
}

# Check command line arguments
if [ $# -eq 0 ]; then
    # No arguments, run all tests
    run_all_tests
else
    # Run specific test(s)
    for test_name in "$@"; do
        # Check if the test exists
        if [[ "$test_name" == */* ]]; then
            # Full path provided
            test_path="$SCRIPTS_DIR/$test_name.ts"
        else
            # Try to find the test in auth or event directory
            if [ -f "$SCRIPTS_DIR/auth/$test_name.ts" ]; then
                test_path="$SCRIPTS_DIR/auth/$test_name.ts"
            elif [ -f "$SCRIPTS_DIR/event/$test_name.ts" ]; then
                test_path="$SCRIPTS_DIR/event/$test_name.ts"
            else
                echo -e "${RED}Error: Test '$test_name' not found${NC}"
                exit 1
            fi
        fi
        
        # Run the test
        run_test "$test_path"
    done
fi 
