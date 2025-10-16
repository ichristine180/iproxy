#!/bin/bash

# Database Setup Script for iProxy
# This script helps initialize and manage the Supabase database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}iProxy Database Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Menu
echo "Select an option:"
echo "1. Initialize Supabase locally"
echo "2. Start local Supabase"
echo "3. Stop local Supabase"
echo "4. Reset database (WARNING: Deletes all data)"
echo "5. Push migrations to remote"
echo "6. Create migration from existing database"
echo "7. Generate TypeScript types"
echo "8. View database status"
echo "9. Exit"
echo ""

read -p "Enter your choice [1-9]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Initializing Supabase...${NC}"
        supabase init
        echo -e "${GREEN}✓ Supabase initialized${NC}"
        echo "Next steps:"
        echo "  1. Update supabase/config.toml with your settings"
        echo "  2. Run: supabase start"
        ;;
    2)
        echo -e "${YELLOW}Starting Supabase locally...${NC}"
        supabase start
        echo -e "${GREEN}✓ Supabase started${NC}"
        echo ""
        echo "Access points:"
        echo "  Studio: http://localhost:54323"
        echo "  API: http://localhost:54321"
        echo "  DB: postgresql://postgres:postgres@localhost:54322/postgres"
        ;;
    3)
        echo -e "${YELLOW}Stopping Supabase...${NC}"
        supabase stop
        echo -e "${GREEN}✓ Supabase stopped${NC}"
        ;;
    4)
        echo -e "${RED}WARNING: This will delete all data in the database!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}Resetting database...${NC}"
            supabase db reset
            echo -e "${GREEN}✓ Database reset complete${NC}"
        else
            echo "Reset cancelled"
        fi
        ;;
    5)
        echo -e "${YELLOW}Pushing migrations to remote...${NC}"
        read -p "Enter your project ref: " project_ref
        supabase link --project-ref "$project_ref"
        supabase db push
        echo -e "${GREEN}✓ Migrations pushed${NC}"
        ;;
    6)
        echo -e "${YELLOW}Creating migration from existing database...${NC}"
        read -p "Enter migration name: " migration_name
        supabase db diff -f "$migration_name"
        echo -e "${GREEN}✓ Migration created${NC}"
        ;;
    7)
        echo -e "${YELLOW}Generating TypeScript types...${NC}"
        supabase gen types typescript --local > types/supabase.ts
        echo -e "${GREEN}✓ Types generated at types/supabase.ts${NC}"
        ;;
    8)
        echo -e "${YELLOW}Database status:${NC}"
        supabase status
        ;;
    9)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
