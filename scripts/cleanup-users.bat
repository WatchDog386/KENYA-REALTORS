@echo off
REM ============================================================================
REM CLEANUP SCRIPT: Reset Users and Logout All Except Superadmin (Windows)
REM ============================================================================
REM This script clears all users except superadmin for fresh testing
REM Usage: cleanup-users.bat
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo USER CLEANUP SCRIPT - Delete All Users Except Superadmin
echo ============================================================================
echo.

REM Confirmation
echo [WARNING] This will delete ALL non-superadmin users!
echo [WARNING] This is a destructive operation. Are you sure?
set /p confirm="Type 'yes' to confirm: "

if /i not "%confirm%"=="yes" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Starting cleanup process...
echo.

REM Step 1: Run the SQL migration
echo [Step 1] Running database cleanup migration...
call supabase db push
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push migration. Check supabase/migrations/ directory.
    exit /b 1
)

echo [✓] Database cleanup complete
echo.

REM Step 2: Clear browser storage instructions
echo [Step 2] Browser Storage Cleanup Instructions
echo ================================================
echo You need to manually clear browser storage:
echo   1. Open browser DevTools (F12)
echo   2. Go to Application ^> Local Storage
echo   3. Delete entries for: supabase-auth-token, supabase-session
echo   4. Or simply clear all storage for localhost
echo.

REM Step 3: Restart dev server instructions
echo [Step 3] Restart Development Server
echo ==================================
echo Stop your development server and restart it:
echo   - Press Ctrl+C to stop the current server
echo   - Run 'bun run dev' or 'npm run dev' again
echo.

REM Step 4: Manual Supabase Auth cleanup
echo [Step 4] Manual Supabase Auth Dashboard Cleanup
echo =============================================
echo Supabase Auth users can only be fully deleted via the dashboard:
echo.
echo   1. Go to Supabase Dashboard ^> Authentication ^> Users
echo   2. For each non-superadmin user:
echo      - Click the user row
echo      - Click 'Delete user' button
echo      - Confirm deletion
echo   3. Superadmin should remain
echo.

REM Step 5: Summary
echo ============================================================================
echo Cleanup Process Summary:
echo ============================================================================
echo.
echo [✓] Database cleaned (profiles and related tables)
echo [⏳] Browser storage - needs manual clearing
echo [⏳] Auth.users - needs manual deletion from Supabase dashboard
echo [⏳] Development server - needs manual restart
echo.
echo NEXT STEPS:
echo ===========
echo 1. Clear browser storage (DevTools ^> Application ^> Local Storage)
echo 2. Delete non-superadmin users from Supabase Auth dashboard
echo 3. Stop and restart your dev server
echo 4. Test new user registration with fresh user account
echo.
echo New registrations will follow the current logic with profile creation
echo.

endlocal
exit /b 0
