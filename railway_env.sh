#!/bin/bash

# Railway PostgreSQL Migration Runner
# This script sets up the environment and runs migrations on Railway

echo "Setting up Railway PostgreSQL migrations..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Get Railway database connection details
echo "Getting Railway database connection details..."

# Get the database variables from Railway
DB_HOST=$(railway variables get DB_HOST)
DB_PORT=$(railway variables get DB_PORT)
DB_USERNAME=$(railway variables get DB_USERNAME)
DB_PASSWORD=$(railway variables get DB_PASSWORD)
DB_NAME=$(railway variables get DB_NAME)

# Set environment variables for the migration runner
export DB_HOST="$DB_HOST"
export DB_PORT="$DB_PORT"
export DB_USERNAME="$DB_USERNAME"
export DB_PASSWORD="$DB_PASSWORD"
export DB_NAME="$DB_NAME"

echo "Database connection configured:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"

# Run the migrations
echo "Running migrations..."
go run run_railway_migrations.go

echo "Migration process completed!"
