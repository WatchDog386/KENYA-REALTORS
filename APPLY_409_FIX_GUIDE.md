# 🚀 Step-by-Step Fix for 409 Conflict Error

## What's Wrong?

When you try to assign technicians, proprietors, or caretakers to properties, you get a **409 Conflict** error. This is because the recent technician category migration broke Row Level Security (RLS) policies that control who can access and modify assignment data.

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com and log in
2. Navigate to your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Apply the Main Fix
1. Click **New Query** (top right)
2. Copy and paste the content from:
   ```
   database/20260302_fix_assignment_rls_409.sql
   ```
3. Click **Run** (or press Ctrl+Shift+Enter)
4. You should see success messages:
   - ✅ Technician Categories RLS Status
   - ✅ Active Assignments Count  
   - ✅ RLS Policies Created

### Step 3: Apply Comprehensive RLS Fix
1. Create another **New Query**
2. Copy and paste the content from:
   ```
   database/20260302_comprehensive_rls_fix.sql
   ```
3. Click **Run**
4. You should see health check results

### Step 4: Apply Grants Fix
1. Create another **New Query**
2. Copy and paste the content from:
   ```
   database/20260302_table_grants_fix.sql
   ```
3. Click **Run**
4. You should see verification results

### Step 5: Refresh Your Application
1. Go back to your application
2. Do a **hard refresh**: 
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`
3. Navigate to **Properties Management** or **Staff Assignment**
4. Try assigning a technician to a property
5. **Error should be gone!** ✅

---

## Detailed Instructions (If You Want to Understand)

### What Were the Problems?

#### Problem 1: Wrong Auth Check in Policies
The migration used this (❌ BROKEN):
```sql
USING (auth.jwt() ->> 'role' = 'super_admin')
```

It should have been (✅ CORRECT):
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
```

#### Problem 2: Missing Service Role Policies
The tables had no policies for `service_role`, which is used by the backend.

#### Problem 3: Missing Table Grants
The tables might not have had proper GRANT permissions for `authenticated` and `service_role`.

### What Does Each Fix Do?

| File | Purpose |
|------|---------|
| `20260302_fix_assignment_rls_409.sql` | Fixes technician_categories and technician_property_assignments RLS policies |
| `20260302_comprehensive_rls_fix.sql` | Updates RLS on all assignment-related tables |
| `20260302_table_grants_fix.sql` | Ensures proper database permissions are set |

---

## Verification Steps

After applying all fixes, run these queries to verify:

### Query 1: Check RLS Policies
```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('technician_categories', 'technician_property_assignments')
ORDER BY tablename, policyname;
```

**Good Result**: You should see policies with `FOR ALL`, `FOR SELECT`, etc., using proper auth checks.

### Query 2: Check Super Admin Can Access
```sql
SELECT 
  COUNT(*) as super_admin_count
FROM public.profiles
WHERE role = 'super_admin' AND (is_active = true OR is_active IS NULL);
```

**Good Result**: Should return `1` or higher.

### Query 3: Check Technician Categories
```sql
SELECT 
  COUNT(*) as category_count
FROM public.technician_categories
WHERE is_active = true;
```

**Good Result**: Should return `1` or higher (at least "General Maintenance").

### Query 4: Check Assignments Exist
```sql
SELECT 
  COUNT(*) as active_assignments
FROM public.technician_property_assignments
WHERE is_active = true;
```

**Good Result**: Should return the number of active assignments (0 or more is fine).

---

## Troubleshooting

### Still Getting 409 Error After Fix?

**Try This:**
1. **Double-check all 3 migrations ran successfully** - Look for error messages
2. **Hard refresh browser** - `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Check browser console** for specific error messages:
   - Press `F12` to open Developer Tools
   - Click **Console** tab
   - Look for red error messages
   - Screenshot and report if not obvious

### Getting Auth/Permission Errors?

**Check Your User Role:**
```sql
SELECT 
  email, 
  role, 
  is_active
FROM public.profiles
WHERE id = auth.uid();
```

**Good Result**: Should show your user with `role = 'super_admin'` and `is_active = true`

### Database Connection Issues?

1. Verify Supabase project is not in maintenance
2. Check network connection
3. Try again in a few minutes

---

## Summary of Changes

✅ Fixed broken RLS policy auth checks  
✅ Added service_role policies to critical tables  
✅ Verified all table grants are set  
✅ Ensured super_admin can manage all assignments  
✅ Verified technician-category relationships  

---

## What NOT to Do

❌ Don't modify the original migration file (20260301_...)  
❌ Don't delete technician categories  
❌ Don't change user roles manually without updating profiles  
❌ Don't skip the hard refresh step  

---

## Next Steps

After confirming the fix works:

1. **Document the issue** - Add to your incident log
2. **Update CI/CD** - If you have automated migrations, ensure these fix scripts run
3. **Test all features** - Try assigning:
   - Technicians to properties
   - Property managers to properties
   - Proprietors to properties
4. **Monitor logs** - Watch for any recurring 409 errors

---

## Questions?

Check these files for more context:
- `FIX_409_ASSIGNMENT_ERROR.md` - Technical explanation
- `docs/PROPERTY_ASSIGNMENT_SYSTEM.md` - System architecture
- `database/FIX_TENANT_RLS_ASSIGNMENT.sql` - Similar past fix as reference
