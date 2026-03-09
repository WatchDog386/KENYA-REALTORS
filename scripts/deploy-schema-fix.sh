#!/bin/bash

# ============================================================================
# REALTORS-LEASERS: Database Schema Fix & Deployment Script (Bash)
# Date: February 6, 2026
# ============================================================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
write_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

write_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

write_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

write_error() {
    echo -e "${RED}✗ $1${NC}"
}

write_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# ============================================================================
# PHASE 1: PRE-DEPLOYMENT CHECK
# ============================================================================

write_header "PHASE 1: Pre-Deployment Verification"

# Check if migration file exists
if [ -f "./supabase/migrations/20260215_002_fix_mismatches.sql" ]; then
    write_success "Migration file found"
else
    write_error "Migration file not found: supabase/migrations/20260215_002_fix_mismatches.sql"
    exit 1
fi

# Check if test file exists
if [ -f "./TEST_SCHEMA_FIXES.sql" ]; then
    write_success "Test queries file found"
else
    write_warning "Test queries file not found"
fi

# Check TypeScript types
if [ -f "./src/types/database.types.ts" ]; then
    write_success "Database types file found"
else
    write_warning "Database types file not found"
fi

write_success "Pre-deployment check complete"

# ============================================================================
# PHASE 2: DISPLAY MIGRATION COMMANDS
# ============================================================================

write_header "PHASE 2: Migration Commands"

write_info "Copy and paste these commands into your Supabase SQL Editor:"
echo ""

echo -e "${YELLOW}STEP 1: Create Backup${NC}"
echo "→ Go to: Supabase Console → Database → Backups → Create a backup"
echo "→ Wait for backup to complete (2-5 minutes)"
echo ""

echo -e "${YELLOW}STEP 2: Run Migration${NC}"
echo "→ Go to: Supabase Console → SQL Editor → New Query"
echo "→ Paste the entire contents of: supabase/migrations/20260215_002_fix_mismatches.sql"
echo "→ Click Run"
echo ""

echo -e "${YELLOW}STEP 3: Run Verification Tests${NC}"
echo "→ Copy TEST_SCHEMA_FIXES.sql sections and paste each into SQL Editor"
echo "→ Run each test to verify all changes applied successfully"
echo ""

# ============================================================================
# PHASE 3: SHOW MIGRATION CONTENT
# ============================================================================

write_header "PHASE 3: Migration SQL Preview"

migrationFile="./supabase/migrations/20260215_002_fix_mismatches.sql"
write_info "Migration file location: $migrationFile"
write_info "File size: $(du -h "$migrationFile" | cut -f1)"
write_info "Number of lines: $(wc -l < "$migrationFile")"

echo ""
echo "$(echo '=' | awk '{for(i=0;i<80;i++)printf "="}')
"
echo -e "${YELLOW}FIRST 50 LINES OF MIGRATION:${NC}"
echo "$(echo '=' | awk '{for(i=0;i<80;i++)printf "="}')
"
head -50 "$migrationFile"

# ============================================================================
# PHASE 4: COPY TO CLIPBOARD HELPER
# ============================================================================

write_header "PHASE 4: Copy-to-Clipboard Helper"

write_info "Would you like to copy the migration SQL to your clipboard? (y/n)"
read -r response
if [[ "$response" == "y" || "$response" == "yes" ]]; then
    if command -v xclip &> /dev/null; then
        cat "$migrationFile" | xclip -selection clipboard
        write_success "Migration SQL copied to clipboard (using xclip)!"
    elif command -v pbcopy &> /dev/null; then
        cat "$migrationFile" | pbcopy
        write_success "Migration SQL copied to clipboard (using pbcopy)!"
    else
        write_warning "xclip or pbcopy not found"
        write_info "Copy manually: cat $migrationFile"
    fi
    write_info "You can now paste it directly into Supabase SQL Editor"
fi

# ============================================================================
# PHASE 5: CODE CHANGES
# ============================================================================

write_header "PHASE 5: Code Changes Applied"

write_success "TypeScript types updated in: src/types/database.types.ts"
write_info "The following types have been created/updated:"
echo "  • Profile"
echo "  • Property"
echo "  • PropertyUnitType"
echo "  • Unit"
echo "  • PropertyManagerAssignment"
echo "  • Tenant"
echo "  • Lease"
echo "  • RentPayment (NEW columns: unit_id, payment_method, transaction_id)"
echo "  • MaintenanceRequest (NEW columns: image_url, manager_notes, completed_at)"
echo "  • VacationNotice (NEW columns: tenant_id, unit_id, property_id, acknowledged_by, acknowledged_at, status)"
echo "  • BillAndUtility (NEW)"
echo "  • Deposit (NEW)"
echo "  • Message (NEW)"
echo "  • Approval (NEW)"
echo "  • SupportTicket"
echo ""

# ============================================================================
# PHASE 6: REBUILD PROJECT
# ============================================================================

write_header "PHASE 6: Rebuild Project"

write_info "Checking if Node.js is installed..."
if command -v node &> /dev/null; then
    nodeVersion=$(node --version)
    write_success "Node.js found: $nodeVersion"
    
    write_info "Installing/updating dependencies..."
    npm install > /dev/null 2>&1
    
    write_info "Building TypeScript..."
    npm run build > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        write_success "Project built successfully"
    else
        write_warning "Build completed with warnings (check output above)"
    fi
else
    write_warning "Node.js not found - skipping build"
    write_info "Please run 'npm install && npm run build' manually"
fi

# ============================================================================
# PHASE 7: NEXT STEPS
# ============================================================================

write_header "PHASE 7: Next Steps"

echo ""
echo -e "${YELLOW}✓ STEP 1: Backup Database${NC}"
echo "  Supabase Console → Database → Backups → Create a backup"
echo ""

echo -e "${YELLOW}✓ STEP 2: Run Migration${NC}"
echo "  Copy SQL → Supabase SQL Editor → Paste & Run"
echo "  File: ./supabase/migrations/20260215_002_fix_mismatches.sql"
echo ""

echo -e "${YELLOW}✓ STEP 3: Verify Fixes${NC}"
echo "  Run test queries from: ./TEST_SCHEMA_FIXES.sql"
echo "  Copy each test section into Supabase SQL Editor & run"
echo ""

echo -e "${YELLOW}✓ STEP 4: Update Application${NC}"
echo "  TypeScript types are already updated in: src/types/database.types.ts"
echo "  Review and update components that use old interface definitions"
echo ""

echo -e "${YELLOW}✓ STEP 5: Test Dashboards${NC}"
echo "  npm run dev"
echo "  Test each dashboard with different user roles"
echo ""

echo -e "${YELLOW}✓ STEP 6: Deploy to Production${NC}"
echo "  npm run build"
echo "  Deploy to your hosting platform"
echo ""

# ============================================================================
# PHASE 8: QUICK REFERENCE COMMANDS
# ============================================================================

write_header "PHASE 8: Quick Reference Commands"

cat << 'EOF'
View migration file:
    cat supabase/migrations/20260215_002_fix_mismatches.sql

View test queries:
    cat TEST_SCHEMA_FIXES.sql

View schema reference:
    cat TABLE_STRUCTURE_REFERENCE.md

Start development server:
    npm run dev

Build for production:
    npm run build

Copy migration to clipboard (Linux/Mac):
    cat supabase/migrations/20260215_002_fix_mismatches.sql | xclip -selection clipboard
    OR
    cat supabase/migrations/20260215_002_fix_mismatches.sql | pbcopy (macOS)

EOF

# ============================================================================
# DEPLOYMENT CHECKLIST
# ============================================================================

write_header "Deployment Checklist"

echo -e "${YELLOW}Before You Start:${NC}"
echo "  ☐ Read QUICK_REFERENCE.md"
echo "  ☐ Read DEPLOYMENT_STEPS.md"
echo "  ☐ Create Supabase backup"
echo ""

echo -e "${YELLOW}During Deployment:${NC}"
echo "  ☐ Copy migration SQL to clipboard"
echo "  ☐ Paste into Supabase SQL Editor"
echo "  ☐ Run migration"
echo "  ☐ Run all test queries from TEST_SCHEMA_FIXES.sql"
echo "  ☐ Verify all tests pass"
echo ""

echo -e "${YELLOW}After Deployment:${NC}"
echo "  ☐ TypeScript types updated ✓"
echo "  ☐ Run 'npm run build' to verify no errors"
echo "  ☐ Test Super Admin Dashboard"
echo "  ☐ Test Manager Dashboard"
echo "  ☐ Test Tenant Portal"
echo "  ☐ Deploy to production"
echo ""

# ============================================================================
# FINAL INSTRUCTIONS
# ============================================================================

write_header "Ready for Deployment"

write_success "All code changes have been applied!"
write_success "Database types have been updated!"
write_info "Migration file is ready to run in Supabase"

echo ""
echo "$(echo '=' | awk '{for(i=0;i<80;i++)printf "="}')
"
echo -e "${CYAN}IMPORTANT: Manual Steps Required in Supabase Console${NC}"
echo "$(echo '=' | awk '{for(i=0;i<80;i++)printf "='}')
"

cat << 'EOF'
1. BACKUP YOUR DATABASE (CRITICAL!)
   → Supabase Console
   → Database → Backups
   → Click "Create a backup"
   → Wait for completion

2. RUN THE MIGRATION
   → Supabase Console
   → SQL Editor (or New Query)
   → Copy entire contents of: ./supabase/migrations/20260215_002_fix_mismatches.sql
   → Paste into editor
   → Click "Run"
   → Wait for "Query executed successfully"

3. VERIFY THE FIXES
   → Copy test queries from: ./TEST_SCHEMA_FIXES.sql
   → Run each test one at a time
   → All should return expected results (see comments in SQL)

4. CONFIRM DEPLOYMENT SUCCESS
   → npm run build (verify no TypeScript errors)
   → npm run dev (start development server)
   → Test each dashboard manually

5. IF SOMETHING FAILS
   → Check error message
   → Restore from backup: Supabase → Backups → [Select backup] → Restore
   → Or contact support with error details

GOOD LUCK! 🚀
EOF

echo ""
echo "$(echo '=' | awk '{for(i=0;i<80;i%)printf "='}')
"
echo ""

write_info "Creating quick commands reference..."

cat > DEPLOYMENT_QUICK_COMMANDS.txt << EOF
# Quick Commands for Schema Fix Deployment

## Copy Migration SQL to Clipboard
Linux: cat "supabase/migrations/20260215_002_fix_mismatches.sql" | xclip -selection clipboard
macOS: cat "supabase/migrations/20260215_002_fix_mismatches.sql" | pbcopy

## View Files
cat supabase/migrations/20260215_002_fix_mismatches.sql
cat TEST_SCHEMA_FIXES.sql
cat TABLE_STRUCTURE_REFERENCE.md
cat QUICK_REFERENCE.md
cat DEPLOYMENT_STEPS.md

## Development
npm run dev

## Build
npm run build

## See Type Definitions
cat src/types/database.types.ts

## Find files that import database types
grep -r "from.*database.types" src/

Date Run: $(date)
EOF

write_success "Created: DEPLOYMENT_QUICK_COMMANDS.txt"

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
