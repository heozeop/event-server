#!/bin/bash

# Check if docker-compose is running
if [ "$(docker ps | grep -c mongo-user)" -eq 0 ] || [ "$(docker ps | grep -c mongo-event)" -eq 0 ]; then
  echo "MongoDB containers are not running. Please start them with docker-compose up first."
  exit 1
fi

# Change to the test directory
cd test

# Make seed-docker.sh executable if it isn't already
chmod +x seed-docker.sh

# Run the Docker seeding script with all data
echo "Seeding all database collections..."
./seed-docker.sh 
