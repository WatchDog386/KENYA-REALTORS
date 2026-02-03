@echo off
REM ============================================================================
REM USER SYNC ENHANCEMENT - SETUP SCRIPT (Windows)
REM ============================================================================
REM This script helps you set up the user sync system quickly on Windows

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   USER SYNC ENHANCEMENT - SETUP WIZARD
echo.
echo   Auth users will sync to profiles table on signup
echo   Super admin can manage all users in dashboard
echo ============================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found
    echo Please run this script from the project root directory
    exit /b 1
)

echo SETUP OPTIONS:
echo.
echo 1 - AUTOMATIC (Recommended)
echo    Command: npm run migrate:user-sync
echo    Time: ~10 seconds
echo.
echo 2 - MANUAL (Via Supabase Dashboard)
echo    Time: ~2 minutes
echo.
echo 3 - PYTHON SCRIPT
echo    Command: python scripts\apply-user-sync-migration.py
echo    Time: ~30 seconds
echo.

set /p option="Which option would you like? (1/2/3): "

if "%option%"=="1" (
    echo.
    echo Running automatic migration...
    call npm run migrate:user-sync
) else if "%option%"=="2" (
    echo.
    echo MANUAL SETUP STEPS:
    echo.
    echo 1. Open: https://rcxmrtqgppayncelonls.supabase.co
    echo 2. Go to: SQL Editor (left sidebar)
    echo 3. Click: "New Query" button
    echo 4. Copy and paste from:
    echo    supabase\migrations\20260205_enhance_user_sync.sql
    echo 5. Click the "Run" button
    echo 6. Wait for completion message
    echo 7. Verify in browser console
    echo.
    echo VERIFICATION:
    echo - Check query results for SUCCESS messages
    echo - Run: SELECT * FROM public.profiles LIMIT 5;
    echo - Should see users with roles and status
    echo.
) else if "%option%"=="3" (
    echo.
    echo Running Python migration script...
    python scripts\apply-user-sync-migration.py
) else (
    echo Invalid option. Please choose 1, 2, or 3
    exit /b 1
)

echo.
echo ============================================================
echo.
echo VERIFICATION STEPS:
echo.
echo 1. Check super admin setup:
echo    SQL: SELECT email, role, status FROM public.profiles
echo         WHERE email = 'duncanmarshel@gmail.com';
echo.
echo 2. Login to admin dashboard:
echo    - Account: duncanmarshel@gmail.com
echo    - Go to: Admin Dashboard ^> All Users
echo    - Should see users list with roles
echo.
echo 3. Test auto-sync:
echo    - Create a new test account
echo    - Wait 2-3 seconds
echo    - Refresh admin dashboard
echo    - New user should appear automatically
echo.
echo ============================================================
echo.
echo SETUP COMPLETE!
echo.
echo Documentation:
echo - USER_SYNC_QUICK_START.md (5-minute guide)
echo - USER_SYNC_SETUP_GUIDE.md (detailed instructions)
echo - USER_SYNC_IMPLEMENTATION_CHECKLIST.md (verification)
echo.
echo Your user sync system is now ready!
echo.
pause
