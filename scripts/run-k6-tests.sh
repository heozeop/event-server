#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Figure out where we are relative to test/k6
CURRENT_DIR=$(pwd)
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR" > /dev/null
SCRIPT_ABS_PATH=$(pwd)
cd "$CURRENT_DIR" > /dev/null

# Determine the project directories
if [[ "$CURRENT_DIR" == */test/k6 ]]; then
    # We're in test/k6
    K6_DIR="$CURRENT_DIR"
    PROJECT_ROOT=$(cd .. && cd .. && pwd)
elif [[ "$CURRENT_DIR" == */test/k6/scripts ]]; then
    # We're in test/k6/scripts
    K6_DIR=$(cd .. && pwd)
    PROJECT_ROOT=$(cd .. && cd .. && cd .. && pwd)
elif [ -d "test/k6" ]; then
    # We're in project root
    K6_DIR="$CURRENT_DIR/test/k6"
    PROJECT_ROOT="$CURRENT_DIR"
elif [[ "$SCRIPT_ABS_PATH" == */test/k6/scripts ]]; then
    # Script is in test/k6/scripts, but we're elsewhere
    K6_DIR=$(dirname "$SCRIPT_ABS_PATH")
    PROJECT_ROOT=$(cd "$K6_DIR" && cd ../.. && pwd)
else
    # Fallback
    echo -e "${RED}Error: Could not determine directories${NC}"
    echo -e "${YELLOW}Please run this script from either:${NC}"
    echo -e "  - The project root directory"
    echo -e "  - The test/k6 directory"
    exit 1
fi

# Default values
DURATION="10s"
VUS=1
TEST_DIR="$K6_DIR/dist"
BASE_URL=""
MODE="quick" # quick, full, or single
RUN_ALL=false # Flag to run all tests
K6_PATH="k6" # Default to k6 in PATH
USE_DOCKER=true # Docker is now the default
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.k6.yml"

# Function to print usage
print_usage() {
    echo -e "${BLUE}Usage:${NC} $0 [options] [test_files...]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -a, --all                 Run all tests"
    echo "  -d, --duration DURATION   Set test duration (default: $DURATION)"
    echo "  -v, --vus NUM_VUS         Set number of virtual users (default: $VUS)"
    echo "  -f, --full                Run tests with their full duration and config"
    echo "  -u, --url BASE_URL        Set the base URL for tests"
    echo "  -t, --test-dir DIR        Set the directory to search for tests (default: $TEST_DIR)"
    echo "  -k, --k6-path PATH        Path to k6 executable (default: $K6_PATH)"
    echo "  -N, --native              Run tests using native k6 instead of Docker"
    echo "  -C, --compose-file FILE   Docker Compose file to use (default: $DOCKER_COMPOSE_FILE)"
    echo ""
    echo "Examples:"
    echo "  $0 --all                                       # Run all tests with Docker (default)"
    echo "  $0 --all --full                                # Run all tests with full duration"
    echo "  $0 --native --all                              # Run all tests with native k6 instead of Docker"
    echo "  $0 --compose-file custom-compose.yml --all     # Use custom Docker Compose file"
    echo "  $0 auth/login-performance-test.js              # Run a specific test"
    echo "  $0 --duration 30s --vus 10 auth/login.js       # Run with custom duration and VUs"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -a|--all)
            RUN_ALL=true
            shift
            ;;
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -v|--vus)
            VUS="$2"
            shift 2
            ;;
        -f|--full)
            MODE="full"
            shift
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--test-dir)
            TEST_DIR="$2"
            shift 2
            ;;
        -k|--k6-path)
            K6_PATH="$2"
            shift 2
            ;;
        -D|--docker)
            USE_DOCKER=true
            shift
            ;;
        -N|--native)
            USE_DOCKER=false
            shift
            ;;
        -C|--compose-file)
            DOCKER_COMPOSE_FILE="$2"
            shift 2
            ;;
        *)
            # If it's not an option, assume it's a test file
            TEST_FILES+=("$1")
            if [ "$MODE" != "full" ]; then
                # Only set to single if not already in full mode
                MODE="single"
            fi
            shift
            ;;
    esac
done

# Save current directory
PREV_DIR=$(pwd)

# Change to the test/k6 directory
cd "$K6_DIR"

# Run the build
echo -e "${YELLOW}Building from $K6_DIR${NC}"
rm -rf dist
pnpm run build:k6 || pnpm build:k6 || node esbuild.config.js

# Go back to where we were
cd "$PREV_DIR"

# Check if build was successful
if [ ! -d "$K6_DIR/dist" ]; then
    echo -e "${RED}Error: Build failed, dist directory still not found in $K6_DIR${NC}"
    exit 1
fi

# Check for docker compose if using docker mode
if [ "$USE_DOCKER" = true ]; then
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker and Docker Compose are required (default mode)${NC}"
        echo -e "${YELLOW}Tip: Use --native to run with native k6 instead${NC}"
        exit 1
    fi

    # Check if the Docker Compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        # Check if it exists at the project root
        if [ -f "$PROJECT_ROOT/docker/docker-compose.k6.yml" ]; then
            DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.k6.yml"
            echo -e "${YELLOW}Using Docker Compose file at: $DOCKER_COMPOSE_FILE${NC}"
        else
            echo -e "${RED}Error: Docker Compose file '$DOCKER_COMPOSE_FILE' not found${NC}"
            echo -e "${YELLOW}Tip: Use --compose-file to specify the path to your Docker Compose file${NC}"
            exit 1
        fi
    fi
else
    # Check if k6 exists
    if ! command -v "$K6_PATH" &> /dev/null; then
        echo -e "${RED}Error: k6 executable not found at '$K6_PATH'${NC}"
        echo -e "${YELLOW}Tip: Use --docker to run with Docker instead (default mode)${NC}"
        echo -e "or install k6 or specify the correct path using --k6-path"
        exit 1
    fi
fi

# Set the base URL flag if provided
URL_FLAG=""
if [ -n "$BASE_URL" ]; then
    URL_FLAG="--env BASE_URL=$BASE_URL"
fi

# Function to run a single test with native k6
run_native_test() {
    local test_file="$1"
    local display_name=$(basename "$test_file")
    
    echo -e "\n${BLUE}=====================================================${NC}"
    echo -e "${GREEN}▶️  Running test: ${YELLOW}$display_name${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    
    if [ "$MODE" = "full" ]; then
        # Run with full duration and config (test file's own options)
        echo -e "${YELLOW}Running in FULL mode (using test file's original config)${NC}"
        "$K6_PATH" run "$test_file" $URL_FLAG
    else
        # Run with quick options (command-line overrides)
        echo -e "${YELLOW}Running in QUICK mode (using command-line duration and VUs)${NC}"
        "$K6_PATH" run "$test_file" --iterations=$VUS --duration=$DURATION $URL_FLAG
    fi
    
    local status=$?
    if [ $status -ne 0 ]; then
        echo -e "${RED}❌ Test failed: $display_name${NC}"
        FAILED_TESTS+=("$display_name")
    else
        echo -e "${GREEN}✅ Test completed successfully: $display_name${NC}"
        PASSED_TESTS+=("$display_name")
    fi
    
    return $status
}

# Function to run a single test with docker compose
run_docker_test() {
    local test_file="$1"
    local display_name=$(basename "$test_file")
    
    echo -e "\n${BLUE}=====================================================${NC}"
    echo -e "${GREEN}▶️  Running test with Docker: ${YELLOW}$display_name ${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    
    # Convert the test file path to be relative to the /dist directory in the container
    local container_test_file="/dist/${test_file#$TEST_DIR/}"
    
    # Prepare the k6 command and environment variables
    local k6_cmd=""
    local env_vars=""
    
    if [ "$MODE" = "full" ]; then
        # Run with full duration and config (test file's own options)
        env_vars="-e FULL_MODE=true -e K6_NO_USAGE_REPORT=true -e K6_NO_THRESHOLDS=false"
        k6_cmd="run $container_test_file $URL_FLAG"
        echo -e "${YELLOW}Running in FULL mode (using test file's original config)${NC}"
    else
        # Run with quick options (command-line overrides)
        k6_cmd="run $container_test_file --iterations=$VUS --duration=$DURATION $URL_FLAG"
        echo -e "${YELLOW}Running in QUICK mode (using command-line duration and VUs)${NC}"
    fi

    # Change to project root for docker compose
    PREV_DIR=$(pwd)
    cd "$PROJECT_ROOT"
    
    # Run the test using docker compose
    echo -e "${YELLOW}Running with Docker Compose from ${PROJECT_ROOT}${NC}"
    docker compose -f "$DOCKER_COMPOSE_FILE" run --rm $env_vars k6 $k6_cmd
    
    local status=$?
    
    # Return to original directory
    cd "$PREV_DIR"
    
    if [ $status -ne 0 ]; then
        echo -e "${RED}❌ Test failed: $display_name${NC}"
        FAILED_TESTS+=("$display_name")
    else
        echo -e "${GREEN}✅ Test completed successfully: $display_name${NC}"
        PASSED_TESTS+=("$display_name")
    fi
    
    return $status
}

# Function to run a test based on the mode (native or docker)
run_test() {
    if [ "$USE_DOCKER" = true ]; then
        run_docker_test "$@"
    else
        run_native_test "$@"
    fi
}

# Initialize counters
PASSED_TESTS=()
FAILED_TESTS=()
TOTAL_TESTS=0

# Start timer
START_TIME=$(date +%s)

# Run tests based on mode and RUN_ALL flag
if [ "$RUN_ALL" = true ]; then
    echo -e "${GREEN}Running all tests in $TEST_DIR${NC}"
    
    # Find all JavaScript files in the test directory
    ALL_TEST_FILES=()
    find "$TEST_DIR" -type f -name "*.js" | grep -v "utils.js" | grep -v "helpers.js" | grep -v "/common/" | sort > /tmp/k6_test_files.txt
    while IFS= read -r file; do
        if [[ "$file" != *".js.map" ]]; then
            ALL_TEST_FILES+=("$file")
        fi
    done < /tmp/k6_test_files.txt
    
    if [ ${#ALL_TEST_FILES[@]} -eq 0 ]; then
        echo -e "${RED}No test files found in $TEST_DIR${NC}"
        echo -e "${YELLOW}Make sure the tests are built correctly in $K6_DIR/dist${NC}"
        exit 1
    fi
    
    for test_file in "${ALL_TEST_FILES[@]}"; do
        run_test "$test_file"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    done
elif [ "$MODE" = "single" ] || [ "$MODE" = "full" ]; then
    # Run specific test files
    for test_pattern in "${TEST_FILES[@]}"; do
        # Check if the pattern includes a full path
        if [[ "$test_pattern" == /* ]]; then
            # Absolute path
            MATCHING_FILES=()
            find "$(dirname "$test_pattern")" -name "$(basename "$test_pattern")" | sort > /tmp/k6_matching_files.txt
            while IFS= read -r file; do
                if [[ "$file" != *".js.map" ]]; then
                    MATCHING_FILES+=("$file")
                fi
            done < /tmp/k6_matching_files.txt
        elif [[ "$test_pattern" == */* ]]; then
            # Relative path with directory
            MATCHING_FILES=()
            find "$TEST_DIR" -path "*$test_pattern*" | sort > /tmp/k6_matching_files.txt
            while IFS= read -r file; do
                if [[ "$file" != *".js.map" ]]; then
                    MATCHING_FILES+=("$file")
                fi
            done < /tmp/k6_matching_files.txt
        else
            # Just filename
            MATCHING_FILES=()
            find "$TEST_DIR" -name "*$test_pattern*" | sort > /tmp/k6_matching_files.txt
            while IFS= read -r file; do
                if [[ "$file" != *".js.map" ]]; then
                    MATCHING_FILES+=("$file")
                fi
            done < /tmp/k6_matching_files.txt
        fi
        
        if [ ${#MATCHING_FILES[@]} -eq 0 ]; then
            echo -e "${RED}No test files found matching: $test_pattern${NC}"
            echo -e "${YELLOW}Available test files in $TEST_DIR:${NC}"
            find "$TEST_DIR" -type f -name "*.js" ! -name "*.js.map" | grep -v "utils.js" | sort | while read -r file; do
                echo "  - $(basename "$file")"
            done
            continue
        fi
        
        for test_file in "${MATCHING_FILES[@]}"; do
            run_test "$test_file"
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
        done
    done
else
    print_usage
    exit 1
fi

# Calculate time taken
END_TIME=$(date +%s)
TIME_TAKEN=$((END_TIME - START_TIME))

# Print summary
echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "Total tests run: ${TOTAL_TESTS}"
echo -e "Passed: ${#PASSED_TESTS[@]} / ${TOTAL_TESTS}"
echo -e "Failed: ${#FAILED_TESTS[@]} / ${TOTAL_TESTS}"
echo -e "Time taken: ${TIME_TAKEN} seconds"

# List failed tests if any
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  - ${test}"
    done
    exit 1
fi

exit 0 
