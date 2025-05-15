#!/bin/bash

# Create directory for keys if it doesn't exist
mkdir -p ./keys

# Generate RSA256 private key
echo "Generating RSA256 private key..."
openssl genpkey -algorithm RSA256 -out ./keys/private.pem

# Extract public key from private key
echo "Extracting public key..."
openssl pkey -in ./keys/private.pem -pubout -out ./keys/public.pem

# Set appropriate permissions
chmod 600 ./keys/private.pem
chmod 644 ./keys/public.pem

echo "Keys generated successfully!"
echo "Private key: ./keys/private.pem"
echo "Public key: ./keys/public.pem"

# Generate JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables for .env file
echo "Generating .env variables..."

# Create or append to apps/auth .env file
touch apps/auth/.env
echo "" >> apps/auth/.env
echo "# JWT RSA256 Keys" >> apps/auth/.env
echo "JWT_PRIVATE_KEY=\"$(cat ./keys/private.pem | grep -v "BEGIN\|END" | tr -d '\n')\"" >> apps/auth/.env
echo "JWT_PUBLIC_KEY=\"$(cat ./keys/public.pem | grep -v "BEGIN\|END" | tr -d '\n')\"" >> apps/auth/.env

echo "Added JWT key environment variables to apps/auth/.env file."
echo "You can now use these in your application."

# Create or append to apps/gateway .env file
touch apps/gateway/.env
echo "" >> apps/gateway/.env
echo "# JWT RSA256 Keys" >> apps/gateway/.env
echo "JWT_PUBLIC_KEY=\"$(cat ./keys/public.pem | grep -v "BEGIN\|END" | tr -d '\n')\"" >> apps/gateway/.env

echo "Added JWT key environment variables to apps/gateway/.env file."
echo "Done!" 
