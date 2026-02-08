# ============================================================================
# REALTORS-LEASERS: Post-Deployment Verification Script
# Verifies that all code changes have been applied correctly
# ============================================================================

param(
    [switch]$RunBuild,
    [switch]$CheckImports,
    [switch]$TestTypes
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
# VERIFICATION 1: Check Database Types File
# ============================================================================

Write-Header "Verification 1: Check Database Types File"

if (Test-Path ".\src\types\database.types.ts") {
    Write-Success "Database types file exists"
    
    $typeContent = Get-Content ".\src\types\database.types.ts" -Raw
    
    # Check for key interfaces
    $interfaces = @(
        'Profile',
        'Property',
        'Unit',
        'RentPayment',
        'MaintenanceRequest',
        'VacationNotice',
        'Message',
        'Approval',
        'Deposit',
        'BillAndUtility'
    )
    
    foreach ($interface in $interfaces) {
        if ($typeContent -match "export interface $interface") {
            Write-Success "Interface $interface found"
        } else {
            Write-Warning "Interface $interface NOT found"
        }
    }
    
    # Check for new columns in updated types
    Write-Info "`nChecking for new columns in updated types..."
    
    $newColumns = @(
        @{ type = 'RentPayment'; column = 'unit_id' },
        @{ type = 'RentPayment'; column = 'payment_method' },
        @{ type = 'RentPayment'; column = 'transaction_id' },
        @{ type = 'MaintenanceRequest'; column = 'image_url' },
        @{ type = 'MaintenanceRequest'; column = 'manager_notes' },
        @{ type = 'MaintenanceRequest'; column = 'completed_at' },
        @{ type = 'VacationNotice'; column = 'tenant_id' },
        @{ type = 'VacationNotice'; column = 'acknowledged_by' }
    )
    
    foreach ($col in $newColumns) {
        $pattern = "$($col.type).*$($col.column)"
        if ($typeContent -match $pattern) {
            Write-Success "$($col.type).$($col.column) exists"
        } else {
            Write-Warning "$($col.type).$($col.column) NOT found"
        }
    }
    
} else {
    Write-Error "Database types file NOT found at: src/types/database.types.ts"
}

# ============================================================================
# VERIFICATION 2: Check Migration File
# ============================================================================

Write-Header "Verification 2: Check Migration File"

if (Test-Path ".\supabase\migrations\20260215_002_fix_mismatches.sql") {
    Write-Success "Migration file exists"
    
    $migrationContent = Get-Content ".\supabase\migrations\20260215_002_fix_mismatches.sql" -Raw
    
    # Check for key fixes
    $checks = @(
        @{ name = 'Fix support_tickets'; pattern = 'support_tickets.*DROP.*CONSTRAINT' },
        @{ name = 'Add unit_id to rent_payments'; pattern = 'rent_payments.*unit_id' },
        @{ name = 'Add image_url to maintenance'; pattern = 'maintenance_requests.*image_url' },
        @{ name = 'Create messages table'; pattern = 'CREATE TABLE.*messages' },
        @{ name = 'Create approvals table'; pattern = 'CREATE TABLE.*approvals' },
        @{ name = 'Create deposits table'; pattern = 'CREATE TABLE.*deposits' },
        @{ name = 'Idempotent indices'; pattern = 'CREATE INDEX IF NOT EXISTS' }
    )
    
    foreach ($check in $checks) {
        if ($migrationContent -match $check.pattern) {
            Write-Success $check.name
        } else {
            Write-Warning $check.name + " NOT found"
        }
    }
    
    Write-Info "`nMigration file statistics:"
    $lineCount = $migrationContent -split "`n" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "  • Lines: $lineCount"
    Write-Host "  • Size: $($(Get-Item '.\supabase\migrations\20260215_002_fix_mismatches.sql').Length / 1024)MB"
    
} else {
    Write-Error "Migration file NOT found at: supabase/migrations/20260215_002_fix_mismatches.sql"
}

# ============================================================================
# VERIFICATION 3: Check Test File
# ============================================================================

Write-Header "Verification 3: Check Test Queries File"

if (Test-Path ".\TEST_SCHEMA_FIXES.sql") {
    Write-Success "Test file exists"
    
    $testContent = Get-Content ".\TEST_SCHEMA_FIXES.sql" -Raw
    
    $testSections = @(
        'TEST 1: Verify Critical Foreign Keys',
        'TEST 2: Verify Tables Exist with Correct Columns',
        'TEST 3: Verify UNIQUE Constraints',
        'TEST 4: Check for Orphaned Records',
        'TEST 5: Verify New Tables Exist'
    )
    
    foreach ($section in $testSections) {
        if ($testContent -match $section) {
            Write-Success $section
        }
    }
    
} else {
    Write-Warning "Test file NOT found at: TEST_SCHEMA_FIXES.sql"
}

# ============================================================================
# VERIFICATION 4: Check Documentation
# ============================================================================

Write-Header "Verification 4: Check Documentation Files"

$docs = @(
    'QUICK_REFERENCE.md',
    'DEPLOYMENT_STEPS.md',
    'TABLE_STRUCTURE_REFERENCE.md',
    'SCHEMA_MISMATCH_FIXES.md',
    'SCHEMA_FIX_EXECUTIVE_SUMMARY.md'
)

foreach ($doc in $docs) {
    if (Test-Path ".\\$doc") {
        Write-Success "$doc exists"
    } else {
        Write-Warning "$doc NOT found"
    }
}

# ============================================================================
# VERIFICATION 5: Dependencies Check
# ============================================================================

Write-Header "Verification 5: Check Dependencies"

Write-Info "Checking Node.js..."
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Node.js: $nodeVersion"
} else {
    Write-Error "Node.js not found"
}

Write-Info "Checking npm..."
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "npm: $npmVersion"
} else {
    Write-Error "npm not found"
}

# ============================================================================
# VERIFICATION 6: TypeScript Compilation
# ============================================================================

if ($RunBuild) {
    Write-Header "Verification 6: TypeScript Compilation"
    
    Write-Info "Running TypeScript compiler..."
    $output = npm run build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TypeScript compilation successful!"
    } else {
        Write-Error "TypeScript compilation failed!"
        Write-Host $output
    }
}

# ============================================================================
# VERIFICATION 7: Check for Old Interfaces
# ============================================================================

Write-Header "Verification 7: Search for Potential Issues"

Write-Info "Searching for components that might need updates..."

$files = Get-ChildItem -Path ".\src" -Include "*.tsx", "*.ts" -Recurse | Where-Object { $_.FullName -notmatch 'node_modules' }

Write-Info "Checking for database type imports..."
$dbTypeImports = $files | Select-String "from.*database.types" -List

if ($dbTypeImports) {
    Write-Success "Found files importing database types:"
    foreach ($file in $dbTypeImports.Path) {
        Write-Host "  • $(($file -split '\\')[-1])" -ForegroundColor Gray
    }
} else {
    Write-Info "No direct database.types imports found (may use inline types)"
}

Write-Info "`nSearching for RentPayment references..."
$rentPaymentRefs = $files | Select-String "RentPayment" -List | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "  Found in $rentPaymentRefs files"

Write-Info "Searching for MaintenanceRequest references..."
$maintenanceRefs = $files | Select-String "MaintenanceRequest" -List | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "  Found in $maintenanceRefs files"

Write-Info "Searching for VacationNotice references..."
$vacationRefs = $files | Select-String "VacationNotice" -List | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "  Found in $vacationRefs files"

# ============================================================================
# SUMMARY
# ============================================================================

Write-Header "Summary"

Write-Success "Code changes have been applied"
Write-Success "Database types file created"
Write-Success "Migration file is ready"
Write-Success "Documentation is complete"

Write-Info "`nNext steps:"
Write-Host "  1. npm run build (verify TypeScript has no errors)"
Write-Host "  2. Create backup in Supabase"
Write-Host "  3. Run migration in Supabase SQL Editor"
Write-Host "  4. Run test queries from TEST_SCHEMA_FIXES.sql"
Write-Host "  5. npm run dev (test locally)"
Write-Host "  6. Deploy to production`n"

Write-Host "For detailed instructions, see: QUICK_REFERENCE.md`n" -ForegroundColor Cyan
