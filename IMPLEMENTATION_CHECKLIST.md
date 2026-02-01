# QUICK IMPLEMENTATION CHECKLIST

## ✅ WHAT'S BEEN DONE

### Database Fixes
- [x] Created migration to fix RLS circular logic → `20260203_fix_registration_signup_error.sql`
- [x] Updated auth trigger to use `SECURITY DEFINER`
- [x] Removed problematic RLS policies
- [x] Added service_role permissions for profile inserts

### Code Changes
- [x] Updated `RegisterPage.tsx` to simplify profile creation
- [x] Changed to use `approval_requests` table instead of `manager_approvals`
- [x] Added proper notifications for tenant verification
- [x] Added proper notifications for manager approval requests
- [x] Improved error messages

## 🔧 WHAT YOU NEED TO DO NOW

### 1. Apply the Database Migration (CRITICAL)
```
⏱️ Time: 5 minutes
📍 Location: Supabase Dashboard → SQL Editor
```

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Create new query
4. Copy contents of: `supabase/migrations/20260203_fix_registration_signup_error.sql`
5. Run the query
6. Verify completion message appears

### 2. Test Tenant Registration
```
⏱️ Time: 10 minutes
```

1. Open your app at `localhost:5173` (or your dev URL)
2. Go to Register page
3. Select "Tenant / Looking to Rent"
4. Fill form:
   - Full Name: `Test Tenant`
   - Phone: `+254712345678`
   - Email: `tenant@example.com`
   - Password: `password123`
   - Role: `Tenant / Looking to Rent`
   - Property: Select any property
   - Unit: Select any unit
5. Click "Create Account"
6. **EXPECTED**: "Registration successful! Awaiting property manager verification."

### 3. Verify Database Records
```
⏱️ Time: 5 minutes
📍 Location: Supabase Dashboard → Table Editor
```

Go to Supabase and check:
- **auth.users** table → Should have new user
- **profiles** table → Should show status='pending'
- **approval_requests** table → Should have type='tenant_verification'
- **units_detailed** table → Unit should be status='reserved'

### 4. Test Property Manager Registration
```
⏱️ Time: 10 minutes
```

1. Go to Register page
2. Select "Property Manager"
3. Fill form:
   - Full Name: `Test Manager`
   - Phone: `+254712345679`
   - Email: `manager@example.com`
   - Password: `password123`
   - Properties: Select one or more
4. Click "Create Account"
5. **EXPECTED**: "Registration successful! Awaiting admin approval."

### 5. Check Manager Approval Records
```
📍 Location: Supabase Dashboard → Table Editor
```

Go to `approval_requests` table and verify:
- New record with type='manager_assignment'
- submitted_by is the manager's user ID
- status='pending'

## ⚠️ COMMON ISSUES & FIXES

### Issue: Still getting "Database error saving new user"
**Solution:**
1. Make sure migration was applied correctly
2. Run this to verify trigger:
   ```sql
   SELECT prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
   ```
   Should return `true`

3. If false, rerun the migration

### Issue: Profile created but with wrong data
**Solution:** The auto-trigger might not be reading metadata. This is fine - profile will be updated on next step.

### Issue: Notifications not appearing
**Solution:** 
1. Check `notifications` table in Supabase
2. Verify property_manager_id exists in `properties` table
3. Verify super_admin users exist in `profiles` with role='super_admin'

---

## 📋 NEXT STEPS (After Testing)

Once registrations work, build these features:

### 1. Property Manager Approval Dashboard
**Show:** Pending tenant approvals
```
Dashboard → Pending Tenants
├─ List approval_requests where type='tenant_verification'
├─ Show tenant info
├─ Show unit details
├─ "Approve" button → sets profile.status='active'
└─ "Reject" button → notification to tenant
```

### 2. Super Admin Approval Dashboard  
**Show:** Pending manager approvals
```
Dashboard → Pending Managers
├─ List approval_requests where type='manager_assignment'
├─ Show manager info
├─ Show managed properties
├─ "Approve" button → sets profile.status='active'
└─ "Reject" button → notification to manager
```

### 3. Update Login Flow
```typescript
// After successful auth:
const profile = await getProfile(user.id);

if (profile.status === 'pending') {
  // Show: "Your account is pending approval"
  // Don't allow login
  return;
}

if (profile.status === 'active') {
  // Allow login based on role
  // Redirect to appropriate dashboard
}
```

---

## 📞 If You Get Stuck

### Check Database Logs
1. Supabase Dashboard → Logs
2. Look for errors during signup

### Check Browser Console
1. F12 → Console tab
2. Look for any error messages

### Manual Testing
1. Create a test user in Supabase auth manually
2. Verify profile was created
3. Check trigger logs

---

## ✨ Key Points to Remember

- **Tenants need property manager approval before login**
- **Property managers need super admin approval before login**
- **Approvals are managed via `approval_requests` table**
- **Notifications notify the approvers**
- **Profile.status = 'pending' blocks login**
- **Only update profile.status after approval**

---

**Status:** Ready to test! 🚀
