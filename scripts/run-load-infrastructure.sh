#!/bin/bash

# Run the load testing infrastructure
echo "Starting load testing infrastructure..."

# Start the Docker Compose services
docker-compose -f docker-compose.k6.yml up -d

echo "Infrastructure is up and running!"
echo "You can access the tools at:"
echo "- Grafana: http://localhost:3000"
echo "- Prometheus: http://localhost:9090"
echo "- cAdvisor: http://localhost:8080"

# Instructions for running k6 tests
echo ""
echo "To run a k6 test, execute the following command:"
echo "docker-compose -f docker-compose.k6.yml exec k6 k6 run /test/dist/your-test-script.js"
echo ""
echo "Make sure your test scripts are built before running the tests."
echo "You can build your test scripts with: npm run build -w test" 
