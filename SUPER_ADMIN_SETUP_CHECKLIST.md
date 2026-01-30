# SUPER ADMIN DASHBOARD - SETUP CHECKLIST

## Pre-Setup Requirements
- [ ] You have access to Supabase project `REALTORS-LEASERS`
- [ ] You have super_admin role in the system
- [ ] Node.js or Bun is installed on your machine
- [ ] You have the migration file: `supabase/migrations/20250124_super_admin_fix.sql`

## Migration Steps (MUST DO FIRST)

### Step 1: Access Supabase
- [ ] Go to https://app.supabase.com
- [ ] Sign in with your Supabase account
- [ ] Select project: `REALTORS-LEASERS`
- [ ] Note Project ID: `jtdtzkpqncpmmenywnlw`

### Step 2: Run the Migration
- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "+ New Query" button
- [ ] Open file: `supabase/migrations/20250124_super_admin_fix.sql`
- [ ] Copy entire contents (Ctrl+A, Ctrl+C)
- [ ] Paste into Supabase SQL Editor (Ctrl+V)
- [ ] Click "Run" button
- [ ] Wait for success message at bottom
- [ ] See output: "Database Schema Setup Complete!"

### Step 3: Verify Tables Were Created
Run this verification query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'properties', 'units', 'leases', 'payments', 'maintenance_requests', 'approval_queue', 'approval_requests')
ORDER BY table_name;
```

- [ ] All 8 tables listed in results
- [ ] No errors in the output

## Application Setup

### Step 4: Install Dependencies
```bash
# Using npm
npm install

# OR using Bun
bun install
```
- [ ] No error messages
- [ ] node_modules folder created

### Step 5: Start Development Server
```bash
# Using npm
npm run dev

# OR using Bun
bun run dev
```
- [ ] No compilation errors
- [ ] Server started successfully
- [ ] URL shown (usually http://localhost:5173)

## Dashboard Verification

### Step 6: Login to Application
- [ ] Open http://localhost:5173 in browser
- [ ] Login with super admin credentials
- [ ] Successfully logged in

### Step 7: Access SuperAdmin Dashboard
- [ ] Navigate to: `/portal/super-admin/dashboard`
- [ ] OR find "Super Admin Dashboard" in navigation menu

### Step 8: Verify Dashboard Data
- [ ] Page loads without errors
- [ ] "Loading dashboard data..." message appears briefly
- [ ] Dashboard fully loads (should take less than 2 seconds)

### Step 9: Check All Dashboard Sections
- [ ] **Key Stats Section** - 4 cards visible:
  - [ ] Properties card showing count
  - [ ] Users card showing count
  - [ ] Revenue card showing total
  - [ ] System Health card showing uptime

- [ ] **Quick Actions Section** - Buttons visible:
  - [ ] Add New User button
  - [ ] Add New Property button
  - [ ] View Reports button
  - [ ] Other action buttons

- [ ] **System Alerts Section** - Shows alerts:
  - [ ] At least one alert visible
  - [ ] Alerts have title and description
  - [ ] Click alert should be interactive

- [ ] **Recent Activity Section** - Shows items:
  - [ ] Properties list visible
  - [ ] Users list visible
  - [ ] Payments list visible
  - [ ] Approvals list visible

- [ ] **System Status Section** (right side):
  - [ ] Database status showing as healthy
  - [ ] API status showing as healthy
  - [ ] Response time displayed
  - [ ] Quick statistics visible

### Step 10: Test Refresh Functionality
- [ ] Click "Refresh" button at top right
- [ ] Wait for data to reload
- [ ] No errors in console (F12)

### Step 11: Test Navigation
- [ ] Click on "Manage Properties" button
- [ ] Verify properties page loads
- [ ] Go back to dashboard
- [ ] Click on "Manage Users" button
- [ ] Verify users page loads
- [ ] Go back to dashboard

## Troubleshooting Checklist

### If Dashboard Won't Load
- [ ] Check browser console (F12 → Console tab)
- [ ] Look for red error messages
- [ ] Check Network tab for failed requests
- [ ] Verify Supabase URL is correct in .env file
- [ ] Verify Supabase keys are correct

### If Data Shows as 0
- [ ] Ensure migration ran completely
- [ ] Check that tables have data (run query in Supabase)
- [ ] Verify RLS policies aren't blocking access
- [ ] Check if you're logged in as super_admin

### If Page Shows "Loading..." Forever
- [ ] Check Supabase connection status
- [ ] Look for timeout errors in console
- [ ] Try refreshing the page
- [ ] Check if Supabase is having issues

### If Getting "Table doesn't exist" error
- [ ] Re-run the migration
- [ ] Verify all 8 tables exist
- [ ] Check table names are lowercase
- [ ] Verify Supabase connection

## Performance Checks

- [ ] Dashboard loads in under 2 seconds
- [ ] Auto-refresh works every 60 seconds
- [ ] Manual refresh works without errors
- [ ] No memory leaks (check DevTools memory tab)
- [ ] Console shows no warnings

## Final Sign-Off

- [ ] All 8 tables created in Supabase ✓
- [ ] All functions created and working ✓
- [ ] Dashboard loads completely ✓
- [ ] Data displays correctly ✓
- [ ] Navigation works properly ✓
- [ ] No errors in console ✓
- [ ] System ready for production ✓

## Quick Reference

### Important File Locations
- Migration: `supabase/migrations/20250124_super_admin_fix.sql`
- Dashboard: `src/pages/portal/SuperAdminDashboard.tsx`
- Setup Guide: `SUPER_ADMIN_SETUP_GUIDE.md`
- This Checklist: `SUPER_ADMIN_SETUP_CHECKLIST.md`

### Important URLs
- Local App: http://localhost:5173
- Dashboard: http://localhost:5173/portal/super-admin/dashboard
- Supabase Console: https://app.supabase.com/project/jtdtzkpqncpmmenywnlw

### Key Configuration
- Supabase Project ID: `jtdtzkpqncpmmenywnlw`
- Dashboard Path: `/portal/super-admin/dashboard`
- Auto-Refresh Interval: 60 seconds

---

**Setup Status**: [ ] Complete  
**Date**: January 24, 2025  
**Last Updated**: January 24, 2025
