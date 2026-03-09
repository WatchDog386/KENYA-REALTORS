#!/bin/bash

# ============================================================================
# SUPER ADMIN DASHBOARD - AUTOMATED SETUP SCRIPT
# ============================================================================
# This script automates the setup of the SuperAdmin Dashboard
# Run this after the migration has been applied to Supabase
#
# Usage:
#   bash setup-super-admin.sh
# ============================================================================

echo "======================================================================"
echo "SUPER ADMIN DASHBOARD - SETUP SCRIPT"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID="jtdtzkpqncpmmenywnlw"
MIGRATION_FILE="supabase/migrations/20250124_super_admin_fix.sql"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
echo ""

if ! command -v npm &> /dev/null && ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ Node.js or Bun not found. Please install Node.js first.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Node.js/Bun found${NC}"
fi

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠ Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

echo ""
echo -e "${YELLOW}Step 2: Checking Supabase connection...${NC}"
echo ""

# Test Supabase connection
if supabase status 2>/dev/null | grep -q "Supabase"; then
    echo -e "${GREEN}✓ Supabase connection successful${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify Supabase connection. Make sure you're logged in:${NC}"
    echo "   Run: supabase login"
fi

echo ""
echo -e "${YELLOW}Step 3: Running migration...${NC}"
echo ""

if [ -f "$MIGRATION_FILE" ]; then
    echo "Migration file found: $MIGRATION_FILE"
    echo ""
    echo "You need to run this migration in Supabase:"
    echo ""
    echo "1. Go to: https://app.supabase.com/project/$SUPABASE_PROJECT_ID/sql/new"
    echo "2. Open file: $MIGRATION_FILE"
    echo "3. Copy entire contents"
    echo "4. Paste into Supabase SQL Editor"
    echo "5. Click 'Run'"
    echo ""
else
    echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Press Enter when migration is complete...${NC}"
read -r

echo ""
echo -e "${YELLOW}Step 4: Verifying tables...${NC}"
echo ""

# Create a verification script
cat > verify-tables.sql << 'EOF'
-- Verify all dashboard tables
SELECT 
    'profiles' as table_name,
    COUNT(*) > 0 as exists
FROM information_schema.tables 
WHERE table_name = 'profiles'
UNION ALL
SELECT 'properties', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'properties'
UNION ALL
SELECT 'units', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'units'
UNION ALL
SELECT 'leases', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'leases'
UNION ALL
SELECT 'payments', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'payments'
UNION ALL
SELECT 'maintenance_requests', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'maintenance_requests'
UNION ALL
SELECT 'approvals', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'approvals'
UNION ALL
SELECT 'approval_requests', COUNT(*) > 0
FROM information_schema.tables WHERE table_name = 'approval_requests';
EOF

echo "Verification script created: verify-tables.sql"
echo ""
echo "Run this query in Supabase to verify all tables exist:"
echo "  1. Open Supabase SQL Editor"
echo "  2. Copy contents of verify-tables.sql"
echo "  3. Run the query"
echo ""

echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
echo ""

if [ -f "package.json" ]; then
    if command -v bun &> /dev/null; then
        echo "Using Bun package manager..."
        bun install
    else
        echo "Using npm package manager..."
        npm install
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 6: Starting development server...${NC}"
echo ""

echo "Starting development server..."
if command -v bun &> /dev/null; then
    bun run dev
else
    npm run dev
fi

echo ""
echo "======================================================================"
echo "SETUP COMPLETE!"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "1. Open browser to: http://localhost:5173"
echo "2. Login with super admin credentials"
echo "3. Navigate to: /portal/super-admin/dashboard"
echo "4. Verify all data loads correctly"
echo ""
echo "If you encounter issues, check:"
echo "- Supabase logs for errors"
echo "- Browser console (F12) for JavaScript errors"
echo "- Database tables exist and have proper RLS policies"
echo ""
echo "======================================================================"
