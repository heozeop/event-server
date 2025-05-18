# Event API Performance Tests

This directory contains performance tests for the Event API endpoints.

## Available Tests

### 1. Event Reward Connection Test

Tests the API endpoint for connecting rewards to events at `POST /events/{eventId}/rewards` with two scenarios:

- Adding rewards to new events: 5 requests per second
- Adding rewards to existing events: 8 requests per second
- Response time under 150ms

**Script**: `event-reward-connection-test.ts`

**Features**:

- Automatically authenticates with admin credentials
- Uses data generated through the prepare scripts
- Distinguishes between new (active) and existing (inactive) events
- Randomly selects events and rewards for the test

**Usage**:

```bash
# Run with default settings
pnpm k6 run dist/event/event-reward-connection-test.js
```

**Requirements**:

- Test data must be generated using the prepare scripts
- Authentication service must be running and accessible

### 2. Event Listing Test

Tests the event listing endpoints with various filter combinations:

- No filter listing: 20 requests per second
- Date filter listing: 10 requests per second
- Location filter listing: 5 requests per second
- Response time under 150ms

**Script**: `event-listing-test.ts`

**Features**:

- Automatically authenticates with admin credentials
- Uses real event data from the prepare scripts
- Generates realistic date filters based on actual event data
- Tests search functionality with location filters
- Validates response data structure and content

**Usage**:

```bash
# Run with default settings
pnpm k6 run dist/event/event-listing-test.js
```

**Requirements**:

- Test data must be generated using the prepare scripts
- Authentication service must be running and accessible

### 3. Event Rewards List Performance Test

Tests the event rewards listing endpoint.

**Script**: `event-rewards-list-performance-test.ts`

### 4. General Event Load Test

General load test for the events API.

**Script**: `load-test.ts`

### 5. Event Reward Request Test

Tests the reward request endpoint performance according to requirements:

- 50 requests per second for 2 minutes
- Response time under 150ms
- Uses real user and event data from preparation scripts

**Script**: `event-reward-request-test.ts`

**Features**:

- Automatically authenticates with admin credentials
- Uses real event and user data from preparation scripts
- Makes POST requests to `/events/{eventId}/request` endpoint
- Validates response structure and timing requirements
- Tracks successful requests with a custom metric

**Usage**:

```bash
# Run with default settings
pnpm k6 run dist/event/event-reward-request-test.js
```

**Requirements**:

- Test data must be generated using the prepare scripts
- Authentication service must be running and accessible

### 6. Event Creation Test

Tests the event creation endpoint performance according to requirements:

- 30 requests per second for 2 minutes
- Response time under 250ms
- Creates events with random data

**Script**: `event-creation-test.ts`

**Features**:

- Automatically authenticates with admin credentials
- Generates unique event data with realistic properties for each request
- Makes POST requests to `/events` endpoint
- Validates response structure and timing requirements
- Tracks successful creations with a custom metric

**Usage**:

```bash
# Run with default settings
pnpm k6 run dist/event/event-creation-test.js
```

**Requirements**:

- Authentication service must be running and accessible
- Admin user must exist in the system

## Authentication Utilities

The `auth-utils.ts` file contains utilities for authenticating with the Auth API and obtaining JWT tokens for test scenarios. The authentication method is particularly useful for admin operations that require privileged access.

## How to Run Tests

1. First, make sure you've generated test data:

   ```bash
   cd test/k6/prepare
   ts-node data-creation.ts
   ```

2. Build the test scripts:

   ```bash
   cd test/k6
   pnpm build
   ```

3. Run a specific test:
   ```bash
   pnpm k6 run dist/event/event-reward-request-test.js
   ```

## Test Results

After the test completes, K6 will display a summary showing:

- Request rates
- Response times (min, average, max, p90, p95)
- Success rates
- Custom metrics for successful operations
