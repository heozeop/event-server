# Rewards Performance Tests

This directory contains performance tests for the rewards-related API endpoints.

## Available Tests

### 1. Rewards Listing Performance Test

Tests the rewards listing API endpoint according to the requirements:
- Without filters: Handle 15 requests per second
- With type filter: Handle 10 requests per second
- Response time: Less than 100ms

**Script**: `rewards-list-performance-test.ts`

### 2. Rewards Request Performance Test

Tests the rewards request lookup API endpoint according to the requirements:
- No filter queries: Handle 10 requests per second
- User filter queries: Handle 5 requests per second
- Event filter queries: Handle 5 requests per second
- Response time: Less than 120ms for all scenarios

**Script**: `rewards-request-performance-test.ts`

### 3. Reward Creation Performance Test

Tests the reward creation endpoints for different reward types:
- Point rewards: Handle 5 requests per second
- Badge rewards: Handle 3 requests per second
- Coupon rewards: Handle 3 requests per second
- Response time: Less than 200ms for all reward types

**Script**: `reward-creation-test.ts`

**Features**:
- Automatically authenticates with admin user credentials
- Generates unique reward data for each test iteration
- Validates response format and data integrity
- Tracks success metrics for each reward type

**Usage**:
```bash
# Run with default settings
pnpm k6 run dist/rewards/reward-creation-test.js
```

**Requirements**:
- Authentication service must be running and accessible
- Admin user must exist in the system (created by data preparation scripts)

## How to Run Rewards Listing Test

### Prerequisites

- Ensure K6 is installed on your system
- The API server should be running
- The database should be seeded with reward data

### Running the Test

First, build the test script:

```bash
cd test/k6
pnpm build
```

This will generate a bundled JavaScript file in the `dist/scripts/rewards` directory.

Then run the test:

```bash
# Basic execution
k6 run dist/scripts/rewards/rewards-list-performance-test.bundle.js

# With a specific authentication token
k6 run --env AUTH_TOKEN=your_jwt_token dist/scripts/rewards/rewards-list-performance-test.bundle.js

# With output to JSON for reporting
k6 run --out json=results.json dist/scripts/rewards/rewards-list-performance-test.bundle.js
```

## Test Parameters

You can customize the test by modifying the test script or using environment variables:

- `AUTH_TOKEN`: JWT token for authentication (default is 'default_token')
- Modify the `API_BASE_URL` constant in the script to point to your API server

## Interpreting Results

After the test completes, K6 will display a summary of the test results, including:

- Request rate: The number of requests per second
- Response time: Min, max, average, median, p90, p95
- Success rate: Percentage of successful requests
- Custom metrics: Count of successful requests with and without filters

The test is considered successful if:
- 95% of responses are under 100ms
- At least 99% of all requests are successful (status 200)
- The minimum number of successful requests is achieved in each scenario

## Test Duration

The test runs for a total of 4 minutes:
- First 2 minutes: No filter requests at 15 RPS
- Last 2 minutes: With filter requests at 10 RPS 
