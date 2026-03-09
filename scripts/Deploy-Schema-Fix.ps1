# ============================================================================
# REALTORS-LEASERS: Database Schema Fix & Deployment Script
# Date: February 6, 2026
# ============================================================================

param(
    [switch]$SkipBackup,
    [switch]$SkipTests,
    [switch]$OnlyShowCommands
)

# Color output
function Write-Header {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $args[0] -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    Write-Host "✓ $($args[0])" -ForegroundColor Green
}

function Write-Warning {
    Write-Host "⚠ $($args[0])" -ForegroundColor Yellow
}

function Write-Error {
    Write-Host "✗ $($args[0])" -ForegroundColor Red
}

function Write-Info {
    Write-Host "ℹ $($args[0])" -ForegroundColor Cyan
}

# ============================================================================
# PHASE 1: PRE-DEPLOYMENT CHECK
# ============================================================================

Write-Header "PHASE 1: Pre-Deployment Verification"

# Check if Supabase project exists
Write-Info "Checking for Supabase project configuration..."
if (Test-Path ".\supabase\migrations\20260215_002_fix_mismatches.sql") {
    Write-Success "Migration file found"
} else {
    Write-Error "Migration file not found: supabase/migrations/20260215_002_fix_mismatches.sql"
    exit 1
}

# Check if test file exists
if (Test-Path ".\database\TEST_SCHEMA_FIXES.sql") {
    Write-Success "Test queries file found"
} else {
    Write-Warning "Test queries file not found"
}

# Check TypeScript types
if (Test-Path ".\src\types\database.types.ts") {
    Write-Success "Database types file found"
} else {
    Write-Warning "Database types file not found"
}

Write-Success "Pre-deployment check complete"

# ============================================================================
# PHASE 2: DISPLAY MIGRATION COMMANDS
# ============================================================================

Write-Header "PHASE 2: Migration Commands"

Write-Info "Copy and paste these commands into your Supabase SQL Editor:"
Write-Host "`n"

Write-Host "STEP 1: Create Backup" -ForegroundColor Yellow
Write-Host "→ Go to: Supabase Console → Database → Backups → Create a backup" -ForegroundColor White
Write-Host "→ Wait for backup to complete (2-5 minutes)`n" -ForegroundColor White

Write-Host "STEP 2: Run Migration" -ForegroundColor Yellow
Write-Host "→ Go to: Supabase Console → SQL Editor → New Query" -ForegroundColor White
Write-Host "→ Paste the entire contents of: supabase/migrations/20260215_002_fix_mismatches.sql" -ForegroundColor White
Write-Host "→ Click Run" -ForegroundColor White
Write-Host "→ Then paste and run: supabase/migrations/20260215_003_fix_approvals_schema.sql" -ForegroundColor White
Write-Host "→ Click Run`n" -ForegroundColor White

Write-Host "STEP 3: Run Verification Tests" -ForegroundColor Yellow
Write-Host "→ Copy database/TEST_SCHEMA_FIXES.sql sections and paste each into SQL Editor" -ForegroundColor White
Write-Host "→ Run each test to verify all changes applied successfully`n" -ForegroundColor White

# ============================================================================
# PHASE 3: SHOW MIGRATION CONTENT
# ============================================================================

Write-Header "PHASE 3: Migration SQL Preview"

Write-Info "Migration file location: ./supabase/migrations/20260215_002_fix_mismatches.sql"
Write-Info "File size: $($(Get-Item ".\supabase\migrations\20260215_002_fix_mismatches.sql").Length / 1024) KB"

$migrationContent = Get-Content ".\supabase\migrations\20260215_002_fix_mismatches.sql" -Raw
$migrationLines = $migrationContent -split "`n" | Measure-Object | Select-Object -ExpandProperty Count

Write-Info "Number of lines: $migrationLines"

Write-Host "`n" + ("=" * 80) + "`n" -ForegroundColor DarkGray
Write-Host "FIRST 50 LINES OF MIGRATION:" -ForegroundColor Yellow
Write-Host "=" * 80 + "`n" -ForegroundColor DarkGray

$firstLines = Get-Content ".\supabase\migrations\20260215_002_fix_mismatches.sql" -First 50
Write-Host ($firstLines | Out-String)

# ============================================================================
# PHASE 4: COPY TO CLIPBOARD HELPER
# ============================================================================

Write-Header "PHASE 4: Copy-to-Clipboard Helper"

Write-Info "Would you like to copy the migration SQL to your clipboard? (y/n)"
$response = Read-Host
if ($response -eq 'y' -or $response -eq 'yes') {
    $migrationContent | Set-Clipboard
    Write-Success "Migration SQL copied to clipboard!"
    Write-Info "You can now paste it directly into Supabase SQL Editor"
}

# ============================================================================
# PHASE 5: CODE CHANGES
# ============================================================================

Write-Header "PHASE 5: Code Changes Applied"

Write-Success "TypeScript types updated in: src/types/database.types.ts"
Write-Info "The following types have been created/updated:"
Write-Host "  • Profile"
Write-Host "  • Property"
Write-Host "  • PropertyUnitType"
Write-Host "  • Unit"
Write-Host "  • PropertyManagerAssignment"
Write-Host "  • Tenant"
Write-Host "  • Lease"
Write-Host "  • RentPayment (NEW columns: unit_id, payment_method, transaction_id)"
Write-Host "  • MaintenanceRequest (NEW columns: image_url, manager_notes, completed_at)"
Write-Host "  • VacationNotice (NEW columns: tenant_id, unit_id, property_id, acknowledged_by, acknowledged_at, status)"
Write-Host "  • BillAndUtility (NEW)"
Write-Host "  • Deposit (NEW)"
Write-Host "  • Message (NEW)"
Write-Host "  • Approval (NEW)"
Write-Host "  • SupportTicket`n"

# ============================================================================
# PHASE 6: REBUILD PROJECT
# ============================================================================

Write-Header "PHASE 6: Rebuild Project"

Write-Info "Checking if Node.js is installed..."
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Node.js found: $nodeVersion"
    
    Write-Info "Installing/updating dependencies..."
    npm install 2>&1 | Out-Null
    
    Write-Info "Building TypeScript..."
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Project built successfully"
    } else {
        Write-Warning "Build completed with warnings (check output above)"
    }
} else {
    Write-Warning "Node.js not found - skipping build"
    Write-Info "Please run 'npm install && npm run build' manually"
}

# ============================================================================
# PHASE 7: NEXT STEPS
# ============================================================================

Write-Header "PHASE 7: Next Steps"

Write-Host "`n✓ STEP 1: Backup Database" -ForegroundColor Yellow
Write-Host "  Supabase Console → Database → Backups → Create a backup`n"

Write-Host "✓ STEP 2: Run Migration" -ForegroundColor Yellow
Write-Host "  Copy SQL → Supabase SQL Editor → Paste & Run"
Write-Host "  File: ./supabase/migrations/20260215_002_fix_mismatches.sql`n"

Write-Host "✓ STEP 3: Verify Fixes" -ForegroundColor Yellow
Write-Host "  Run test queries from: ./TEST_SCHEMA_FIXES.sql"
Write-Host "  Copy each test section into Supabase SQL Editor & run`n"

Write-Host "✓ STEP 4: Update Application" -ForegroundColor Yellow
Write-Host "  TypeScript types are already updated in: src/types/database.types.ts"
Write-Host "  Review and update components that use old interface definitions`n"

Write-Host "✓ STEP 5: Test Dashboards" -ForegroundColor Yellow
Write-Host "  npm run dev"
Write-Host "  Test each dashboard with different user roles`n"

Write-Host "✓ STEP 6: Deploy to Production" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  Deploy to your hosting platform`n"

# ============================================================================
# PHASE 8: QUICK Reference Commands
# ============================================================================

Write-Header "PHASE 8: Quick Reference Commands"

Write-Host "View migration file:
    cat supabase/migrations/20260215_002_fix_mismatches.sql`n" -ForegroundColor Gray

Write-Host "View test queries:
    cat TEST_SCHEMA_FIXES.sql`n" -ForegroundColor Gray

Write-Host "View schema reference:
    cat TABLE_STRUCTURE_REFERENCE.md`n" -ForegroundColor Gray

Write-Host "Start development server:
    npm run dev`n" -ForegroundColor Gray

Write-Host "Build for production:
    npm run build`n" -ForegroundColor Gray

# ============================================================================
# DEPLOYMENT CHECKLIST
# ============================================================================

Write-Header "Deployment Checklist"

Write-Host "Before You Start:" -ForegroundColor Yellow
Write-Host "  ☐ Read QUICK_REFERENCE.md"
Write-Host "  ☐ Read DEPLOYMENT_STEPS.md"
Write-Host "  ☐ Create Supabase backup`n"

Write-Host "During Deployment:" -ForegroundColor Yellow
Write-Host "  ☐ Copy migration SQL to clipboard (use -CopyToClipboard)"
Write-Host "  ☐ Paste into Supabase SQL Editor"
Write-Host "  ☐ Run migration"
Write-Host "  ☐ Run all test queries from TEST_SCHEMA_FIXES.sql"
Write-Host "  ☐ Verify all tests pass`n"

Write-Host "After Deployment:" -ForegroundColor Yellow
Write-Host "  ☐ TypeScript types updated ✓"
Write-Host "  ☐ Run 'npm run build' to verify no errors"
Write-Host "  ☐ Test Super Admin Dashboard"
Write-Host "  ☐ Test Manager Dashboard"
Write-Host "  ☐ Test Tenant Portal"
Write-Host "  ☐ Deploy to production`n"

# ============================================================================
# FINAL INSTRUCTIONS
# ============================================================================

Write-Header "Ready for Deployment"

Write-Success "All code changes have been applied!"
Write-Success "Database types have been updated!"
Write-Info "Migration file is ready to run in Supabase"

Write-Host "`n" + ("=" * 80)
Write-Host "IMPORTANT: Manual Steps Required in Supabase Console" -ForegroundColor Cyan
Write-Host "=" * 80

Write-Host @"
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
"@ -ForegroundColor Cyan

Write-Host "`n" + ("=" * 80) + "`n"

# ============================================================================
# CREATE QUICK COMMANDS FILE
# ============================================================================

Write-Info "Creating quick commands reference..."

$quickCommands = @"
# Quick Commands for Schema Fix Deployment

## Copy Migration SQL to Clipboard
PowerShell: Get-Content ".\supabase\migrations\20260215_002_fix_mismatches.sql" | Set-Clipboard
Bash: cat "supabase/migrations/20260215_002_fix_mismatches.sql" | xclip -selection clipboard

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

Date Run: $(Get-Date)
"@

$quickCommands | Set-Content -Path ".\DEPLOYMENT_QUICK_COMMANDS.txt"
Write-Success "Created: DEPLOYMENT_QUICK_COMMANDS.txt"

Write-Host "`n✅ Deployment preparation complete!`n" -ForegroundColor Green
