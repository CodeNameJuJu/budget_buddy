#!/bin/bash

# Export script environment variables
# Update these values to match your local PostgreSQL setup

DB_HOST=localhost
DB_PORT=5400
DB_NAME=budget_buddy
DB_USERNAME=postgres
DB_PASSWORD=Sp33dTr4p@200s
DB_SSLMODE=disable
DB_DEBUG=false

echo "Database connection configured for local export"
echo "Please update DB_PASSWORD in this script to match your local PostgreSQL password"
