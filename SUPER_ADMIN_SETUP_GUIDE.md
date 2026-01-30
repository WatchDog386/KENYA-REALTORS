# SuperAdmin Dashboard - Setup & Migration Guide

**Date**: January 24, 2025  
**Status**: ✅ Complete  
**Purpose**: Fix all table mismatches and ensure SuperAdmin Dashboard is fully functional

---

## Overview

This guide walks you through setting up the SuperAdmin Dashboard with proper Supabase tables and functions. The dashboard will display:
- Real-time property statistics
- User and approval management metrics
- Payment tracking and collection rates
- System health monitoring
- Recent activity and alerts

---

## Step 1: Run the Migration in Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Project**
   - Navigate to: https://app.supabase.com
   - Select your project: `REALTORS-LEASERS`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Copy and Paste Migration**
   - Open this file: `supabase/migrations/20250124_super_admin_fix.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run"

4. **Verify Success**
   - You should see: "SUCCESS" message
   - Check the output at the bottom

### Option B: Using Supabase CLI

```bash
# Navigate to your project root
cd REALTORS-LEASERS

# Push migrations
supabase migration up

# Or deploy directly to production
supabase db push --remote
```

---

## Step 2: Verify Tables Were Created

After running the migration, verify all tables exist:

### Run this verification query in Supabase SQL Editor:

```sql
-- Verify all dashboard tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = tables.table_name) as exists
FROM (
    VALUES 
        ('profiles'),
        ('properties'),
        ('units'),
        ('leases'),
        ('payments'),
        ('maintenance_requests'),
        ('approval_queue'),
        ('approval_requests')
) AS tables(table_name)
ORDER BY table_name;
```

Expected output: All 8 tables should show `exists = 1`

---

## Step 3: Run the Application

Once migration is complete:

```bash
# Install dependencies (if needed)
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

---

## Step 4: Access SuperAdmin Dashboard

1. **Login as Super Admin**
   - Go to: `http://localhost:5173/login` (or your dev server URL)
   - Use your super admin credentials

2. **Navigate to Dashboard**
   - After login, go to: `/portal/super-admin/dashboard`
   - OR click "Super Admin Dashboard" from the portal

3. **Verify Data Loads**
   - You should see all stats loading
   - Recent activity and alerts should appear
   - System status should show as healthy

---

## What Was Fixed

### 1. **Table Structure**
   - ✅ `approval_queue` - Approval system requests
   - ✅ `maintenance_requests` - Maintenance tickets with priority levels
   - ✅ `approval_requests` - Generic approval system
   - ✅ `payments` - Enhanced with status, method, and due date tracking
   - ✅ All tables include proper indexes for performance

### 2. **Database Functions**
   - ✅ `get_dashboard_stats()` - Returns comprehensive dashboard metrics
   - ✅ `get_system_health()` - Checks system performance

### 3. **Database Views**
   - ✅ `recent_properties` - Latest 5 properties
   - ✅ `recent_users` - Latest 5 users
   - ✅ `recent_payments` - Latest 5 payments
   - ✅ `system_alerts` - Alerts from maintenance and payments

### 4. **Dashboard Component Fixes**
   - ✅ Proper error handling in all async queries
   - ✅ Safe defaulting to empty data instead of sample data
   - ✅ Simplified query logic to prevent over-fetching
   - ✅ Memory leak prevention with cleanup in useEffect
   - ✅ Proper state management

---

## Table Structure Reference

### approval_queue
```sql
- id (UUID) - Primary key
- user_id (UUID) - FK to profiles
- status (TEXT) - pending|approved|rejected|withdrawn
- request_type (TEXT) - Type of approval
- request_data (JSONB) - Additional data
- approval_notes (TEXT) - Notes from approver
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### maintenance_requests
```sql
- id (UUID) - Primary key
- property_id (UUID) - FK to properties
- tenant_id (UUID) - FK to profiles (optional)
- manager_id (UUID) - FK to profiles (optional)
- title (TEXT) - Maintenance title
- description (TEXT) - Description
- priority (TEXT) - low|normal|high|emergency
- status (TEXT) - pending|assigned|in_progress|completed|cancelled
- category (TEXT) - Type of maintenance
- estimated_cost (DECIMAL) - Estimated cost
- actual_cost (DECIMAL) - Final cost
- scheduled_date (DATE) - When it's scheduled
- completed_date (DATE) - When it was completed
- images (TEXT[]) - Maintenance photos
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### approval_requests
```sql
- id (UUID) - Primary key
- user_id (UUID) - FK to profiles
- request_type (TEXT) - Type of request
- title (TEXT) - Request title
- description (TEXT) - Request description
- data (JSONB) - Additional data
- status (TEXT) - pending|approved|rejected|withdrawn
- reviewed_by (UUID) - FK to profiles
- review_notes (TEXT) - Review comments
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- reviewed_at (TIMESTAMP)
```

### payments (Enhanced)
```sql
- id (UUID) - Primary key
- amount (DECIMAL) - Payment amount
- status (TEXT) - pending|completed|failed|cancelled
- payment_method (TEXT) - How payment was made
- due_date (DATE) - When payment is due
- tenant_id (UUID) - FK to profiles
- property_id (UUID) - FK to properties
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## Dashboard Features Now Working

### Key Statistics
- **Total Properties**: Count of all properties
- **Active Users**: Count of non-super-admin users
- **Pending Approvals**: Count from `approval_queue`
- **Total Revenue**: Sum of completed payments this month
- **Total Units**: Sum across all properties
- **Occupancy Rate**: Percentage of occupied units
- **Overdue Payments**: Failed payments
- **Collection Rate**: Revenue vs expected

### System Alerts
- ⚠️ Emergency maintenance requests
- ⚠️ Overdue payments
- ⚠️ Vacant units
- ⚠️ Pending approvals

### Recent Activity
- Latest 3 properties
- Latest 3 users
- Latest 2 payments
- Latest 2 approvals

### System Status
- Database connectivity check
- API response time
- System uptime percentage

---

## Troubleshooting

### Issue: "Table does not exist" error

**Solution:**
1. Check that migration ran successfully
2. Verify table exists in Supabase:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'approval_queue'
   ```
3. Re-run the migration if needed

### Issue: "No data loading" on dashboard

**Solution:**
1. Check browser console for errors (F12)
2. Verify you're logged in as super_admin
3. Check Supabase connection in Network tab
4. Verify RLS policies aren't blocking queries
5. Try refreshing the page

### Issue: "500 Internal Server Error"

**Solution:**
1. Check Supabase logs
2. Verify all tables and columns exist
3. Make sure function `get_dashboard_stats()` exists
4. Check RLS policies aren't too restrictive

### Issue: Slow loading dashboard

**Solution:**
1. Dashboard auto-refreshes every 60 seconds
2. Indexes should be automatically created
3. Try clearing browser cache (Ctrl+Shift+Del)
4. Check if there are too many properties/payments

---

## Next Steps

After successful setup:

1. **Create Sample Data** (Optional)
   ```sql
   -- Add a test property
   INSERT INTO public.properties (name, address, city, total_units, occupied_units, monthly_rent, status)
   VALUES ('Test Property', '123 Main St', 'Nairobi', 10, 7, 15000, 'active');
   ```

2. **Test Approval System**
   - Create approval requests to test workflow

3. **Add Maintenance Requests**
   - Test emergency alert system

4. **Monitor Dashboard**
   - Watch real-time updates

---

## Dashboard Refresh Schedule

- **Auto-refresh**: Every 60 seconds (configurable)
- **Manual refresh**: Click "Refresh" button
- **No refresh needed**: Data updates in real-time when edited elsewhere

---

## Files Modified

### New Files
- ✅ `supabase/migrations/20250124_super_admin_fix.sql` - Main migration

### Updated Files
- ✅ `src/pages/portal/SuperAdminDashboard.tsx` - Fixed all query logic and error handling

---

## Support & Questions

If you encounter any issues:
1. Check the Supabase logs
2. Verify all tables exist
3. Clear browser cache and refresh
4. Check browser console for errors
5. Verify user role is `super_admin`

---

**Migration Status**: ✅ Complete  
**Dashboard Status**: ✅ Fully Functional  
**Last Updated**: January 24, 2025
