#!/bin/bash

# Newsletter App - Local Database Restoration Script (Linux/Unix Version)
# This script restores the database for local development

set -e  # Exit on any error

echo "=== Newsletter App Local Database Restoration ==="
echo ""

# Configuration - Modify these values for your local environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-newsletter_app}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
if [ ! -f "export-database-local.sql" ]; then
    print_error "export-database-local.sql not found in current directory!"
    print_error "Please ensure you have the local database export file."
    exit 1
fi

print_status "Found export-database-local.sql - ready for local restoration"

# Set environment variable for password to avoid prompt
export PGPASSWORD="$DB_PASSWORD"

print_status "Restoring database from export-database-local.sql..."
print_status "This may take a few moments..."

# Restore the database
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f export-database-local.sql

if [ $? -eq 0 ]; then
    echo ""
    print_status "=== Database restoration completed successfully ==="
    echo ""
    print_warning "Default user accounts have been created with password \"admin123\""
    print_warning "Use admin@company.com for administrator access"
else
    echo ""
    print_error "=== Database restoration failed ==="
    print_error "Check the error message above for details."
    exit 1
fi