# Load Testing for Event Server

This directory contains k6 load tests for the Event Server application. The tests are designed to simulate various user interactions with the API to evaluate performance under load.

## Directory Structure

```
test/
├── scripts/         # k6 test scripts
│   ├── auth/        # Authentication related tests
│   │   ├── login.ts     # User login
│   │   └── register.ts  # User registration
│   ├── event/       # Event related tests
│   │   ├── create-event.ts    # Create a new event
│   │   └── request-reward.ts  # Request a reward for an event
│   └── common/      # Shared utilities
│       ├── helpers.ts     # Helper functions
│       └── types.ts       # TypeScript type definitions
├── data/            # Test data
│   ├── users.json   # Test user data
│   └── events.json  # Test event data
├── config/          # Configuration files
├── fixtures.ts      # Data generation script
└── README.md        # This file
```

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) - Load testing tool
- Node.js and npm/pnpm - For running the data generation scripts
- ts-node - For running TypeScript files directly

## Getting Started

### 1. Generate Test Data

Before running the tests, you need to generate test data:

```bash
# From the project root
ts-node test/fixtures.ts
```

This will create test users and events in the `test/data` directory.

### 2. Run Tests

You can run all tests or specific tests using the provided script:

```bash
# Run all tests
./scripts/run-load-test.sh

# Run specific test(s)
./scripts/run-load-test.sh login create-event
```

#### Using the k6 Test Runner Script

Alternatively, you can use the k6 test runner script in the test/k6 directory:

```bash
# Show help
./run-k6-tests.sh --help

# Run all tests in quick mode (short duration)
./run-k6-tests.sh --all

# Run all tests with their full duration
./run-k6-tests.sh --all --full

# Run specific test(s)
./run-k6-tests.sh auth/login-performance-test.js event/event-creation-test.js

# Run with custom duration and virtual users
./run-k6-tests.sh --duration 30s --vus 10 auth/login-performance-test.js

# Run tests with a custom base URL
./run-k6-tests.sh --url http://localhost:3000/api --all

# Run tests with native k6 instead of Docker
./run-k6-tests.sh --native --all

# Run tests with a custom Docker Compose file
./run-k6-tests.sh --compose-file custom-compose.yml --all
```

### Environment Variables

The tests use the following environment variables:

- `BASE_URL` - The base URL for the API (default: `http://localhost:3000/api`)
- `ADMIN_EMAIL` - Email for admin user (default: `admin@example.com`)
- `ADMIN_PASSWORD` - Password for admin user (default: `Admin123!`)

You can set these variables before running the tests:

```bash
export BASE_URL=http://staging-api.example.com/api
./scripts/run-load-test.sh
```

## Running with Docker Compose (Default Mode)

The test suite runs using Docker Compose by default, which includes Prometheus for metrics collection and monitoring.

### Prerequisites for Docker Mode

- Docker and Docker Compose installed
- `docker-compose.k6.yml` file in your project root (or specify a custom file with `--compose-file`)

### Running Tests with Docker

To run tests with Docker Compose (default mode):

```bash
# Start the Docker Compose environment first (optional)
docker compose -f docker-compose.k6.yml up -d prometheus

# Run all tests (Docker is the default)
./run-k6-tests.sh --all

# Run a specific test with Docker
./run-k6-tests.sh auth/login-performance-test.js
```

### Running Tests with Native k6

If you prefer to use a locally installed k6 binary instead of Docker:

```bash
# Run all tests with native k6
./run-k6-tests.sh --native --all

# Run a specific test with native k6
./run-k6-tests.sh --native auth/login-performance-test.js
```

### Viewing Metrics

When running with Docker Compose, performance metrics will be sent to Prometheus. You can access the Prometheus dashboard at:

```
http://localhost:9090
```

### Environment Variables for Docker

Additional environment variables can be set in the `docker-compose.k6.yml` file:

```yaml
environment:
  - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
  - K6_OUT=output-prometheus-remote
  - BASE_URL=http://your-api-server:3000/api
```

## Available Tests

### Authentication Tests

- **login.ts** - Tests the login endpoint with random user credentials
- **register.ts** - Tests the user registration endpoint with random user data

### Event Tests

- **create-event.ts** - Tests creating new events with random data
- **request-reward.ts** - Tests requesting rewards for random events
- **event-rewards-list-performance-test.ts** - Tests the performance of listing event rewards (20 req/s, 120ms response time)

## Monitoring Results

The test results are displayed in the console after each test run. For more detailed analysis, you can configure k6 to output results to a dashboard.

## Adding New Tests

To add a new test:

1. Create a new `.ts` file in the appropriate directory
2. Import the necessary modules and helpers
3. Define the test options (stages, thresholds)
4. Implement the test function
5. Export the function as default
