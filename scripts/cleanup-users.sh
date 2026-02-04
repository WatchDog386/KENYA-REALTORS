#!/bin/bash

# ============================================================================
# CLEANUP SCRIPT: Reset Users and Logout All Except Superadmin
# ============================================================================
# This script clears all users except superadmin for fresh testing
# Usage: bash cleanup-users.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}USER CLEANUP SCRIPT - Delete All Users Except Superadmin${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Confirmation
echo -e "${RED}⚠️  WARNING: This will delete ALL non-superadmin users!${NC}"
echo -e "${RED}This is a destructive operation. Are you sure? (yes/no)${NC}"
read -p "Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting cleanup process...${NC}"
echo ""

# Step 1: Run the SQL migration
echo -e "${BLUE}Step 1: Running database cleanup migration...${NC}"
supabase db push || {
    echo -e "${RED}❌ Failed to push migration. Check supabase/migrations/ directory.${NC}"
    exit 1
}

echo -e "${GREEN}✅ Database cleanup complete${NC}"
echo ""

# Step 2: Clear browser storage (client-side)
echo -e "${BLUE}Step 2: Clearing browser storage...${NC}"
echo "You need to manually clear browser storage in your browser:"
echo "  1. Open browser DevTools (F12)"
echo "  2. Go to Application > Local Storage"
echo "  3. Delete entries for: supabase-auth-token, supabase-session"
echo "  4. Or simply clear all storage for localhost"
echo ""

# Step 3: Restart the app
echo -e "${BLUE}Step 3: Restarting development server...${NC}"
echo "Stop your development server and restart it:"
echo "  - Press Ctrl+C to stop the current server"
echo "  - Run 'bun run dev' or 'npm run dev' again"
echo ""

# Step 4: Manual Supabase Auth cleanup
echo -e "${YELLOW}Step 4: Manual Supabase Auth Dashboard Cleanup${NC}"
echo "Supabase Auth users can only be fully deleted via the dashboard:"
echo ""
echo "  1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/users"
echo "  2. For each non-superadmin user:"
echo "     - Click the user row"
echo "     - Click 'Delete user' button"
echo "     - Confirm deletion"
echo "  3. Superadmin should remain"
echo ""

# Step 5: Summary
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Cleanup Process Summary:${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "✅ Database cleaned (profiles and related tables)"
echo "⏳ Browser storage - needs manual clearing"
echo "⏳ Auth.users - needs manual deletion from Supabase dashboard"
echo "⏳ Development server - needs manual restart"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Clear browser storage (DevTools > Application > Local Storage)"
echo "2. Delete non-superadmin users from Supabase Auth dashboard"
echo "3. Stop and restart your dev server"
echo "4. Test new user registration with fresh user account"
echo ""
echo -e "${GREEN}New registrations will follow the current logic with profile creation${NC}"
echo ""

exit 0
