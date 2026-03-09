@echo off
REM ============================================================================
REM SUPER ADMIN USER CREATION - WINDOWS BATCH SCRIPT
REM ============================================================================
REM This script guides you through creating the super admin user
REM
REM Usage:
REM   1. Run this script: setup-super-admin.bat
REM   2. Follow the on-screen instructions
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ===============================================================
echo    SUPER ADMIN USER CREATION WIZARD
echo ===============================================================
echo.
echo Email:     duncanmarshel@gmail.com
echo Password:  Marshel@1992
echo Role:      super_admin
echo.

echo STEP 1: Creating user in Supabase Authentication
echo ===============================================================
echo.
echo Please complete these steps manually:
echo.
echo   1. Go to https://app.supabase.com
echo   2. Select your REALTORS-LEASERS project
echo   3. Navigate to Authentication ^> Users
echo   4. Click "Add user" or "Invite"
echo   5. Fill in the form:
echo      - Email:         duncanmarshel@gmail.com
echo      - Password:      Marshel@1992
echo      - Auto confirm:  CHECK THIS BOX
echo   6. Click "Create user"
echo   7. Copy the User ID (UUID) that appears
echo.

pause

set /p USER_ID="Paste the User ID (UUID): "

if "!USER_ID!"=="" (
    echo.
    echo ERROR: User ID cannot be empty
    pause
    exit /b 1
)

echo.
echo User ID: !USER_ID!
echo.

echo STEP 2: Creating profile in database
echo ===============================================================
echo.
echo A SQL script has been created: CREATE_SUPER_ADMIN_USER.sql
echo.
echo Please do the following:
echo.
echo   1. Open CREATE_SUPER_ADMIN_USER.sql in a text editor
echo   2. Find the line: id = '{USER_ID}'
echo   3. Replace {USER_ID} with: !USER_ID!
echo   4. Save the file
echo   5. Go to https://app.supabase.com
echo   6. Select your project ^> SQL Editor
echo   7. Create a new query
echo   8. Copy and paste the entire SQL script
echo   9. Click "Run"
echo.

pause

cls
echo.
echo ===============================================================
echo    SUPER ADMIN SETUP COMPLETE!
echo ===============================================================
echo.
echo Login Credentials:
echo   Email:    duncanmarshel@gmail.com
echo   Password: Marshel@1992
echo.
echo Next Steps:
echo   1. Open a terminal in this folder
echo   2. Run: npm run dev
echo   3. Go to http://localhost:5173/login
echo   4. Enter the credentials above
echo   5. You should be redirected to /portal/super-admin/dashboard
echo.
echo SuperAdmin will have access to:
echo   - Dashboard (view system metrics)
echo   - Properties Management (manage all properties)
echo   - User Management (manage all users)
echo   - Approval Queue (review all requests)
echo   - Analytics (view system reports)
echo   - System Settings (configure system)
echo   - Leases Management (manage all leases)
echo   - Payments Management (view all payments)
echo   - Manager Portal (manage managers)
echo   - Profile Management (manage profiles)
echo   - Refund Status (track refunds)
echo.

pause
