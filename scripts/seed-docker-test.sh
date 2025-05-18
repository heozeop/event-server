#!/bin/bash

echo "Running database seeding inside Docker container..."

# Execute the seeding command in the gateway container
# It has access to both MongoDB containers via the Docker network
docker exec gateway sh -c "cd /app/test && USER_DB_URI=mongodb://mongo-user:27017 EVENT_DB_URI=mongodb://mongo-event:27017 pnpm seed:db"

echo "Seeding process completed!" 
