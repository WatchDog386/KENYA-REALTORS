# 🔧 Fix: Update Tenant Allocation to Ayden Homes

## Problem
- Tenant (fanteskorri36@gmail.com) is currently showing "Kisumu Suites" property
- Need to allocate them to the new "Ayden Homes" property
- Currency already changed to KES ✅
- Dynamic property name already implemented ✅

## Solution: 3 Steps

### Step 1: Run SQL Verification Script (2 min)

First, run this in **Supabase SQL Editor** to check the current state:

```sql
-- Check what property fanteskorri36@gmail.com is allocated to
SELECT 
  au.email,
  p.name as property_name,
  p.address,
  t.status,
  t.move_in_date
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';

-- Check if Ayden Homes exists
SELECT id, name, address, city FROM properties 
WHERE LOWER(name) LIKE '%ayden%';

-- Check all your users
SELECT email, created_at FROM auth.users 
WHERE email IN (
  'korrifantes36@gmail.com',
  'fanteskorri36@gmail.com', 
  'dancunmarshel@gmail.com'
);
```

### Step 2: Run the Fix Script (1 min)

If the above shows the tenant is allocated to "Kisumu Suites", run the complete fix:

**Location**: `FIX_AYDEN_HOMES_ALLOCATION.sql`

Copy the entire contents and paste into **Supabase SQL Editor**, then click **Execute**.

This will:
- ✅ Create Ayden Homes property if it doesn't exist
- ✅ Move fanteskorri36@gmail.com to Ayden Homes
- ✅ Create a lease for Ayden Homes (KES 35,000/month)
- ✅ Verify everything is correct

### Step 3: Test in Your App (2 min)

```bash
npm run dev
```

Login with: **fanteskorri36@gmail.com**

Verify:
- ✅ Dashboard header shows: **AYDEN HOMES**
- ✅ Property page shows: **Ayden Homes** (not Kisumu Suites)
- ✅ Currency shows: **KES 35,000** (not dollars)
- ✅ Address shows: **123 Nairobi Avenue, Nairobi**

---

## What Each User Should See

### fanteskorri36@gmail.com (Tenant)
```
Header:          AYDEN HOMES
Property:        Ayden Homes
Address:         123 Nairobi Avenue, Nairobi
Unit:            (from units table)
Rent:            KES 35,000.00
Deposit:         KES 70,000.00
Status:          Active
```

### korrifantes36@gmail.com (Property Manager)
```
Dashboard:       Properties Management
Can see:         Ayden Homes property
Can see:         fanteskorri36@gmail.com as tenant
Can manage:      Payments, maintenance, tenants
```

### dancunmarshel@gmail.com (Super Admin)
```
Dashboard:       Super Admin
Can see:         All properties (Ayden Homes + others)
Can see:         All users (tenant, manager, admin)
Can create:      New properties
Can assign:      Managers to properties
```

---

## Code Changes Made

### 1. Property.tsx Enhanced
- ✅ Now fetches unit_id from tenants table
- ✅ Looks up unit_number from units table
- ✅ Properly displays property details
- ✅ Currency in KES

### 2. PortalLayout.tsx Dynamic
- ✅ Fetches tenant's property_id from database
- ✅ Gets property name and displays in header
- ✅ Updates dynamically when tenant is allocated

---

## Database Structure

### How Tenant Allocation Works

```
auth.users (fanteskorri36@gmail.com)
    ↓
tenants table (user_id → fanteskorri36@gmail.com)
    ↓
properties table (Ayden Homes)
    ↓
units table (Unit A-101, etc.)
    ↓
leases table (monthly_rent, deposit)
```

When a tenant logs in:
1. System gets their user_id
2. Looks up in tenants table
3. Finds their property_id (Ayden Homes)
4. Fetches property details
5. Displays property name in header

---

## Troubleshooting

### Issue: Still Shows "Kisumu Suites"

**Solution:**
1. Clear browser cache: `Ctrl+Shift+Del`
2. Close all browser tabs with the app
3. Restart dev server: `npm run dev`
4. Login again

### Issue: "Ayden Homes" Not Found

**Solution:**
Make sure you ran the FIX_AYDEN_HOMES_ALLOCATION.sql script that creates it.

### Issue: Property Page Blank

**Solution:**
1. Check browser console for errors
2. Verify tenant is allocated in database:
```sql
SELECT * FROM tenants 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com');
```
3. Make sure property exists:
```sql
SELECT * FROM properties WHERE name = 'Ayden Homes';
```

---

## Files You Need

| File | Purpose |
|------|---------|
| **FIX_AYDEN_HOMES_ALLOCATION.sql** | Complete fix script (run this) |
| **Property.tsx** | Already updated with unit lookup |
| **PortalLayout.tsx** | Already updated with dynamic property |

---

## What Should Happen After Running Fix

1. **Database State**
   - Ayden Homes property exists ✅
   - fanteskorri36@gmail.com allocated to it ✅
   - Lease created (KES 35,000/month) ✅

2. **App Behavior**
   - Header shows "AYDEN HOMES" ✅
   - Property details load correctly ✅
   - Currency shows "KES 35,000" ✅

3. **User Experience**
   - Tenant sees their correct property
   - All information is accurate
   - Everything works as expected

---

## Quick Checklist

Before testing:
- [ ] Run FIX_AYDEN_HOMES_ALLOCATION.sql
- [ ] Wait 30 seconds for database to sync
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Login and verify

After testing:
- [ ] Header shows "AYDEN HOMES"
- [ ] Property shows "Ayden Homes"
- [ ] Address shows "123 Nairobi Avenue"
- [ ] Currency shows "KES 35,000"
- [ ] No errors in console

---

## Next Steps

Once fixed and verified:
1. Test property manager (korrifantes36@gmail.com) can see tenant
2. Test super admin (dancunmarshel@gmail.com) can see all
3. Create additional test properties if needed
4. Set up more test tenants for multi-property testing

---

**Status**: 🔧 **READY TO FIX**

Run the SQL script above and your tenant will see the correct Ayden Homes property!

