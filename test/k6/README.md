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

## Available Tests

### Authentication Tests

- **login.ts** - Tests the login endpoint with random user credentials
- **register.ts** - Tests the user registration endpoint with random user data

### Event Tests

- **create-event.ts** - Tests creating new events with random data
- **request-reward.ts** - Tests requesting rewards for random events

## Monitoring Results

The test results are displayed in the console after each test run. For more detailed analysis, you can configure k6 to output results to a dashboard.

## Adding New Tests

To add a new test:

1. Create a new `.ts` file in the appropriate directory
2. Import the necessary modules and helpers
3. Define the test options (stages, thresholds)
4. Implement the test function
5. Export the function as default 
