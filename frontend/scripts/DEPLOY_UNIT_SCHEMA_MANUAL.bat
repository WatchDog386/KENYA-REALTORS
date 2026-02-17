@echo off
echo Deploying Unit Management Schema Updates...
echo.

cd /d "%~dp0"

REM Check if Supabase CLI is installed (optional, assuming we rely on the JS script previously or just manual check)
REM But since the JS script failed, we can try to use psql if available, or just instruct the user.

echo ===================================================
echo PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
echo ===================================================
type supabase\migrations\20260218_upgrade_property_units.sql
echo.
echo ===================================================
echo Copy the content above and run it in the SQL Editor.
echo ===================================================

pause
