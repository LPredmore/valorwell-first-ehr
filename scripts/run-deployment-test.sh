#!/bin/bash

# Calendar System Deployment Test Runner
# This script runs the deployment test for the calendar system

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CALENDAR SYSTEM DEPLOYMENT TEST ===${NC}"
echo -e "${BLUE}Starting deployment test at $(date)${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run this test.${NC}"
    exit 1
fi

# Check if the deployment test script exists
if [ ! -f "scripts/deployment-test.js" ]; then
    echo -e "${RED}Error: Deployment test script not found at scripts/deployment-test.js${NC}"
    exit 1
fi

# Set environment variables for the test
# Uncomment and modify these if needed for your environment
# export SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Run the deployment test
echo -e "${BLUE}Running deployment test...${NC}"
node scripts/deployment-test.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Deployment test completed successfully!${NC}"
    echo -e "${GREEN}The calendar system is ready for deployment to production.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}Deployment test failed. Please review the errors above.${NC}"
    exit 1
fi