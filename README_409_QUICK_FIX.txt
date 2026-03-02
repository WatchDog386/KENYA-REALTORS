# QUICK REFERENCE: 409 Error Fix

## The Problem
```
Failed to load resource: the server responded with a status of 409 ()
```
When assigning technicians/staff to properties.

## Root Cause
Broken RLS policies from technician category migration.

## 3-Step Solution

### 1️⃣ Open SQL Editor
Go to Supabase → SQL Editor → New Query

### 2️⃣ Run These 3 Scripts (In Order)
Each script: Copy → Paste → Run → Wait for success

**Script 1:**
```
database/20260302_fix_assignment_rls_409.sql
```

**Script 2:**
```
database/20260302_comprehensive_rls_fix.sql
```

**Script 3:**
```
database/20260302_table_grants_fix.sql
```

### 3️⃣ Refresh Browser
- Windows: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

## ✅ Verify It Works
Try assigning a technician to a property → Should work!

## What Was Fixed
| Issue | Fix |
|-------|-----|
| Wrong auth() check in RLS policies | Updated to use profiles table lookup |
| Missing service_role policies | Added for all assignment tables |
| Missing table grants | Verified all permissions set |

## Time to Fix: ~5 minutes
- Apply migrations: 3 minutes
- Refresh & test: 2 minutes

## Questions?
See: `FIX_409_ASSIGNMENT_ERROR.md` or `APPLY_409_FIX_GUIDE.md`
