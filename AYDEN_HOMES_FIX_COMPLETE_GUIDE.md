# ✅ Ayden Homes Allocation Fix - Complete Guide

## Your Current Setup

You have 3 existing users in the database:
```
1. korrifantes36@gmail.com    → Property Manager
2. fanteskorri36@gmail.com    → Tenant (CURRENTLY ON KISUMU SUITES)
3. dancunmarshel@gmail.com    → Super Admin
```

## What Needs to Happen

**Move the tenant from "Kisumu Suites" → "Ayden Homes"**

---

## 🚀 Solution: Run 1 SQL Script

### Location
File: `FIX_AYDEN_HOMES_ALLOCATION.sql`

### How to Run

1. **Go to**: Supabase Dashboard → Your Project → SQL Editor
2. **Click**: "New Query"
3. **Copy/Paste**: Entire contents of `FIX_AYDEN_HOMES_ALLOCATION.sql`
4. **Click**: "Execute"

### What It Does

```sql
✅ Checks current allocation (you'll see the results)
✅ Creates "Ayden Homes" property if missing
✅ Creates a lease for Ayden Homes (KES 35,000/month)
✅ Moves fanteskorri36@gmail.com to Ayden Homes
✅ Verifies the changes were successful
```

### Expected Output

After running, you should see these results:

**CURRENT ALLOCATION** (before)
```
fanteskorri36@gmail.com | Kisumu Suites | active
```

**VERIFICATION: ALLOCATION UPDATED** (after)
```
fanteskorri36@gmail.com | Ayden Homes | active | 123 Nairobi Avenue | Nairobi
```

---

## ✅ Code Already Updated

### 1. Property.tsx
```typescript
// Now properly fetches unit_number from units table
const { data: unitData } = await supabase
  .from("units")
  .select("unit_number")
  .eq("id", tenantData.unit_id)
  .single();
```

### 2. PortalLayout.tsx  
```typescript
// Already fetches property name dynamically
const { data: propertyData } = await supabase
  .from("properties")
  .select("name")
  .eq("id", tenantData.property_id)
  .single();

if (propertyData?.name) {
  setPropertyName(propertyData.name.toUpperCase());
}
```

### 3. Currency
```typescript
// Already changed to KES
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
```

---

## 🧪 Test After Running SQL

### Step 1: Start App
```bash
npm run dev
```

### Step 2: Login as Tenant
```
Email:    fanteskorri36@gmail.com
Password: (your password)
```

### Step 3: Verify
Go to Property page and check:

**✅ Expected to See:**
```
Property:        Ayden Homes
Address:         123 Nairobi Avenue, Nairobi
Monthly Rent:    KES 35,000.00
Deposit:         KES 70,000.00
Header:          AYDEN HOMES
```

**❌ NOT to See:**
```
Property:        Kisumu Suites  ← WRONG
Address:         Milimani, Kisumi
Monthly Rent:    $35,000  ← WRONG (should be KES)
```

---

## 📊 Your User Roles

### fanteskorri36@gmail.com (Tenant)
```
What they can see:
├── Their property: Ayden Homes
├── Their unit details
├── Rent amount: KES 35,000
├── Payment history
├── Maintenance requests
├── Documents
└── Messages
```

### korrifantes36@gmail.com (Property Manager)
```
What they can see:
├── All properties they manage
├── All tenants at their properties
├── Payment records
├── Maintenance requests
├── Reports and analytics
└── Can make property updates
```

### dancunmarshel@gmail.com (Super Admin)
```
What they can see:
├── All properties in system
├── All users (tenants, managers, admins)
├── All payments
├── All maintenance
├── System reports
└── Can create/edit properties
```

---

## 🔍 How to Verify Before & After

### Before Running SQL (Current State)
```sql
-- Run this in Supabase SQL Editor to see current state

SELECT 
  au.email,
  p.name as property_name,
  t.status
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';
```

**You'll see:**
```
fanteskorri36@gmail.com | Kisumu Suites | active
```

### After Running FIX SQL (New State)
Run the same query again, you should see:
```
fanteskorri36@gmail.com | Ayden Homes | active
```

---

## 📝 Database Structure

### Tables Involved

```
auth.users
├── id (user ID)
├── email (fanteskorri36@gmail.com)
└── created_at

tenants (connects users to properties)
├── user_id → links to auth.users
├── property_id → links to properties
├── status (active/inactive)
└── move_in_date

properties (the actual properties)
├── id
├── name (Ayden Homes)
├── address
├── city
└── zip_code

leases (rental agreements)
├── property_id → links to properties
├── monthly_rent (35000 KES)
├── security_deposit (70000 KES)
└── status (active)

units (individual rental units)
├── property_id
├── unit_number (A-101, etc.)
└── unit_type
```

---

## ⚡ Quick Reference

### SQL Commands to Run

**1. Check current allocation:**
```sql
SELECT p.name, t.status FROM tenants t
JOIN properties p ON t.property_id = p.id
WHERE t.user_id = (SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com');
```

**2. Update allocation:**
```sql
UPDATE tenants SET property_id = (
  SELECT id FROM properties WHERE name = 'Ayden Homes'
) WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com'
);
```

**3. Verify update:**
```sql
SELECT p.name, t.status FROM tenants t
JOIN properties p ON t.property_id = p.id
WHERE t.user_id = (SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com');
```

---

## 🎯 Complete Workflow

### What You Do:
1. Run the SQL script in Supabase
2. Wait 30 seconds
3. Clear browser cache (Ctrl+Shift+Del)
4. Restart dev server (npm run dev)
5. Login and verify

### What Happens:
1. Database is updated ✅
2. App syncs with database ✅
3. Header shows "AYDEN HOMES" ✅
4. Property details show correct info ✅
5. Currency shows KES ✅

---

## ✨ Features Now Ready

### For Tenant (fanteskorri36@gmail.com):
- ✅ Dashboard shows Ayden Homes
- ✅ Currency in KES (35,000 not $35,000)
- ✅ Property details correct
- ✅ Unit information accurate
- ✅ Can view payments, maintenance, documents

### For Manager (korrifantes36@gmail.com):
- ✅ Can see Ayden Homes property
- ✅ Can see all tenants
- ✅ Can manage payments and maintenance
- ✅ Can allocate new tenants
- ✅ Can track occupancy

### For Super Admin (dancunmarshel@gmail.com):
- ✅ Can see all properties
- ✅ Can see all users
- ✅ Can create new properties
- ✅ Can assign managers
- ✅ Can view all reports

---

## 📂 Files You Need

| File | What to Do |
|------|-----------|
| **FIX_AYDEN_HOMES_ALLOCATION.sql** | Copy/paste entire contents into Supabase SQL Editor |
| **FIX_KISUMU_TO_AYDEN_HOMES.md** | This guide (for reference) |
| **Property.tsx** | Already updated ✅ |
| **PortalLayout.tsx** | Already updated ✅ |

---

## 🚨 If Something Goes Wrong

### Problem: Still Shows Kisumu Suites

**Step 1:** Clear cache
```
Ctrl+Shift+Del in browser
Close all tabs with app
```

**Step 2:** Restart server
```bash
Ctrl+C (stop current npm run dev)
npm run dev (restart)
```

**Step 3:** Check database
```sql
SELECT * FROM tenants 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com');
```

### Problem: Property Page Blank

**Check:**
1. Is tenant allocated? (run SQL above)
2. Does Ayden Homes exist?
```sql
SELECT * FROM properties WHERE name = 'Ayden Homes';
```
3. Check browser console for errors

### Problem: 404 or Can't Login

**Solution:**
1. Verify user exists in auth
2. Verify email is spelled correctly
3. Try logout/login again

---

## ✅ Final Checklist

Before: 
- [ ] Check current allocation shows Kisumu Suites
- [ ] Note the property ID if visible

After Running SQL:
- [ ] SQL executed successfully
- [ ] Saw "VERIFICATION: ALLOCATION UPDATED" message
- [ ] Showed Ayden Homes in results

Testing:
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Logged in as tenant
- [ ] Property page shows "Ayden Homes"
- [ ] Currency shows "KES 35,000"
- [ ] Header shows "AYDEN HOMES"
- [ ] No errors in console

---

## 🎉 Success!

Once you see:
```
Property: Ayden Homes
Address: 123 Nairobi Avenue, Nairobi
Currency: KES 35,000.00
Header: AYDEN HOMES
```

You're done! Your tenant is now properly allocated to Ayden Homes. ✅

---

**Ready? Run: FIX_AYDEN_HOMES_ALLOCATION.sql**

