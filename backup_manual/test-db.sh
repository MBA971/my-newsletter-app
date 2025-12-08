#!/bin/bash

echo "========================================"
echo "Testing PostgreSQL Connection"
echo "========================================"

echo "Loading environment variables..."
echo ""

echo "Running database connection test..."
node test-db-connection.js

echo ""
echo "Test completed."