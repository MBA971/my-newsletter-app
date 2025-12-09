#!/bin/bash

# Newsletter App - Production Database Restoration Script (Linux/Unix Version)
# This script restores the database with properly hashed passwords for production use

set -e  # Exit on any error

echo "=== Newsletter App Production Database Restoration ==="
echo ""

# Configuration - Modify these values for your production environment
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
if [ ! -f "export-database-final.sql" ]; then
    print_error "export-database-final.sql not found in current directory!"
    print_error "Please ensure you have the production database export file."
    exit 1
fi

print_status "Found export-database-final.sql - ready for production restore"

# Set environment variable for password to avoid prompt
export PGPASSWORD="$DB_PASSWORD"

print_status "Restoring database from export-database-final.sql..."
print_status "This may take a few moments..."

# Restore the database
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f export-database-final.sql

if [ $? -eq 0 ]; then
    echo ""
    print_status "=== Database restoration completed successfully ==="
    echo ""
    print_warning "IMPORTANT SECURITY NOTICE:"
    print_warning "Default passwords have been set for all users."
    print_warning "Please change all user passwords immediately in production!"
    print_warning "Use the admin account to manage other user accounts."
else
    echo ""
    print_error "=== Database restoration failed ==="
    print_error "Check the error message above for details."
    exit 1
fi