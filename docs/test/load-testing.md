# Load Testing with k6

This document explains how to perform load testing on the event server using k6, Prometheus, and Grafana.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and pnpm installed

## Setup

We have a complete infrastructure setup for load testing that includes:

1. **k6**: For running load tests
2. **Prometheus**: For collecting and storing metrics
3. **Grafana**: For visualizing metrics
4. **cAdvisor**: For collecting container resource metrics

## Running the Infrastructure

To start the infrastructure, run:

```bash
# Make the script executable if needed
chmod +x scripts/run-load-infrastructure.sh

# Run the infrastructure
./scripts/run-load-infrastructure.sh
```

This will start all the necessary services in Docker containers.

## Accessing the Tools

- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **cAdvisor**: http://localhost:8080

The default credentials for Grafana are:
- Username: admin
- Password: admin

## Writing Load Tests

Load tests are written in TypeScript using the k6 API. You can find example tests in the `test/scripts` directory.

### Example Load Test

Here's a simple example of a load test that hits the events API:

```typescript
import { check } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import { sleep } from 'k6';

export const options: Options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests below 1s
  },
};

export default function() {
  const eventsResponse = http.get('http://event:3002/api/events');
  
  check(eventsResponse, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

## Building and Running Tests

1. Build your test scripts:

```bash
pnpm run build -w test
```

2. Run a load test:

```bash
docker-compose -f docker-compose.k6.yml exec k6 k6 run /test/dist/scripts/event/load-test.js
```

## Monitoring Test Results

During and after the test, you can view the results in Grafana. The k6 dashboard will show metrics such as:

- Request rate and response times
- Success/failure rates
- Virtual user count
- Container resource usage (CPU, memory)

## Cleaning Up

To stop and remove all the containers, run:

```bash
docker-compose -f docker-compose.k6.yml down
```

This will stop all services but preserve the volumes with the data. If you want to remove the volumes as well, add the `-v` flag. 
