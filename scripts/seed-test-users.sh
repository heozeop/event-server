#!/bin/bash

echo "Starting test user database seeding..."

# Set default MongoDB URI if not already set
export USER_DB_URI=${USER_DB_URI:-"mongodb://localhost:27017"}
export USER_DB_NAME=${USER_DB_NAME:-"user-db"}

echo "Using MongoDB: $USER_DB_URI/$USER_DB_NAME"

# Execute the test setup script
npx ts-node test/usecase/test.setup.ts

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo "✅ Test users seeded successfully!"
else
  echo "❌ Failed to seed test users. Check the error messages above."
  exit 1
fi 
