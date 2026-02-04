@echo off
REM ============================================================================
REM SUPER ADMIN DASHBOARD - SETUP SCRIPT (WINDOWS)
REM ============================================================================
REM This script automates the setup of the SuperAdmin Dashboard
REM Run this after the migration has been applied to Supabase
REM
REM Usage:
REM   setup-super-admin.bat
REM ============================================================================

setlocal enabledelayedexpansion

color 0A
echo.
echo ======================================================================
echo SUPER ADMIN DASHBOARD - SETUP SCRIPT (WINDOWS)
echo ======================================================================
echo.

REM Configuration
set SUPABASE_PROJECT_ID=jtdtzkpqncpmmenywnlw
set MIGRATION_FILE=supabase\migrations\20250124_super_admin_fix.sql

REM Step 1: Check prerequisites
echo Step 1: Checking prerequisites...
echo.

where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [✓] npm found
) else (
    where bun >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [✓] Bun found
    ) else (
        color 0C
        echo [✗] Node.js or Bun not found. Please install Node.js first.
        color 0A
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Checking migration file...
echo.

if exist "%MIGRATION_FILE%" (
    echo [✓] Migration file found: %MIGRATION_FILE%
) else (
    color 0C
    echo [✗] Migration file not found: %MIGRATION_FILE%
    color 0A
    pause
    exit /b 1
)

echo.
echo Step 3: Running migration (MANUAL)
echo.

echo You need to run this migration in Supabase:
echo.
echo 1. Go to: https://app.supabase.com/project/%SUPABASE_PROJECT_ID%/sql/new
echo 2. Open file: %MIGRATION_FILE%
echo 3. Copy entire contents
echo 4. Paste into Supabase SQL Editor
echo 5. Click 'Run'
echo.
echo After completing the above, press any key to continue...
pause

echo.
echo Step 4: Installing dependencies...
echo.

if exist "package.json" (
    where bun >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo Using Bun package manager...
        call bun install
    ) else (
        echo Using npm package manager...
        call npm install
    )
    echo [✓] Dependencies installed
) else (
    color 0C
    echo [✗] package.json not found
    color 0A
    pause
    exit /b 1
)

echo.
echo Step 5: Starting development server...
echo.

echo Starting development server...
where bun >nul 2>nul
if %ERRORLEVEL% equ 0 (
    call bun run dev
) else (
    call npm run dev
)

echo.
echo ======================================================================
echo SETUP COMPLETE!
echo ======================================================================
echo.
echo Next steps:
echo 1. Open browser to: http://localhost:5173
echo 2. Login with super admin credentials
echo 3. Navigate to: /portal/super-admin/dashboard
echo 4. Verify all data loads correctly
echo.
echo If you encounter issues, check:
echo - Supabase logs for errors
echo - Browser console (F12) for JavaScript errors
echo - Database tables exist and have proper RLS policies
echo.
echo ======================================================================
echo.

pause
