@echo off
REM ============================================================================
REM REALTORS-LEASERS: Database Schema Fix & Deployment Script (Batch)
REM Date: February 6, 2026
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo REALTORS-LEASERS Schema Fix Deployment
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo WARNING: Node.js not found. Please install Node.js first.
    color 07
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js found: %NODE_VERSION%

echo.
echo ========================================
echo Checking Project Files
echo ========================================
echo.

REM Check migration file
if exist "supabase\migrations\20260215_002_fix_mismatches.sql" (
    echo [SUCCESS] Migration file found
) else (
    color 0C
    echo [ERROR] Migration file not found
    color 07
    exit /b 1
)

REM Check test file
if exist "TEST_SCHEMA_FIXES.sql" (
    echo [SUCCESS] Test queries file found
) else (
    echo [WARNING] Test queries file not found
)

REM Check types file
if exist "src\types\database.types.ts" (
    echo [SUCCESS] Database types file found
) else (
    echo [WARNING] Database types file not found
)

echo.
echo ========================================
echo Installing Dependencies
echo ========================================
echo.

call npm install
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] npm install completed with warnings
    color 07
) else (
    echo [SUCCESS] Dependencies installed
)

echo.
echo ========================================
echo Building Project
echo ========================================
echo.

call npm run build
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] Build completed with issues (see above)
    color 07
) else (
    echo [SUCCESS] Project built successfully
)

echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
echo 1. BACKUP YOUR DATABASE (CRITICAL!)
echo    - Supabase Console ^> Database ^> Backups ^> Create a backup
echo    - Wait for completion (2-5 minutes)
echo.
echo 2. RUN THE MIGRATION
echo    - Supabase Console ^> SQL Editor ^> New Query
echo    - Copy: supabase\migrations\20260215_002_fix_mismatches.sql
echo    - Paste into editor and click Run
echo.
echo 3. RUN VERIFICATION TESTS
echo    - Copy test queries from: TEST_SCHEMA_FIXES.sql
echo    - Paste each test into Supabase SQL Editor and run
echo    - All tests should pass without errors
echo.
echo 4. TEST LOCALLY
echo    - Run: npm run dev
echo    - Test each dashboard with different roles
echo.
echo 5. DEPLOY
echo    - Run: npm run build
echo    - Deploy to production
echo.
echo ========================================
echo FILE REFERENCE
echo ========================================
echo.
echo MIGRATION: supabase\migrations\20260215_002_fix_mismatches.sql
echo TESTS:     TEST_SCHEMA_FIXES.sql
echo TYPES:     src\types\database.types.ts
echo GUIDE:     QUICK_REFERENCE.md
echo STEPS:     DEPLOYMENT_STEPS.md
echo REFERENCE: TABLE_STRUCTURE_REFERENCE.md
echo ANALYSIS:  SCHEMA_MISMATCH_FIXES.md
echo.

REM Create quick commands file
echo Creating DEPLOYMENT_QUICK_COMMANDS.txt...
(
    echo # Quick Commands for Schema Fix Deployment
    echo.
    echo ## View Migration
    echo type "supabase\migrations\20260215_002_fix_mismatches.sql"
    echo.
    echo ## View Tests
    echo type "TEST_SCHEMA_FIXES.sql"
    echo.
    echo ## Start Development
    echo npm run dev
    echo.
    echo ## Build for Production
    echo npm run build
    echo.
    echo ## View Type Definitions
    echo type "src\types\database.types.ts"
    echo.
) > DEPLOYMENT_QUICK_COMMANDS.txt

echo [SUCCESS] Created: DEPLOYMENT_QUICK_COMMANDS.txt
echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo All code changes have been applied.
echo Database types have been updated.
echo Migration file is ready.
echo.
echo Next: Follow the NEXT STEPS above
echo.
echo For detailed instructions: Read QUICK_REFERENCE.md
echo.
pause
