#!/bin/bash

echo "Starting usecase tests..."

# Navigate to the project root directory if needed
# cd "$(dirname "$0")/.." 

# Run the tests using pnpm
cd test/usecase && pnpm run test:usecase

# Check if the tests executed successfully
if [ $? -eq 0 ]; then
  echo "✅ Usecase tests completed successfully!"
else
  echo "❌ Usecase tests failed. Check the error messages above."
  exit 1
fi 
