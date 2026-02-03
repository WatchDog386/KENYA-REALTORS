# User Sync Implementation - Deployment Guide

## Prerequisites

- Access to Supabase dashboard
- Database migrations tool or direct SQL access
- Node.js project running with updated components
- Super admin user account

## Step-by-Step Deployment

### Step 1: Run Database Migration

#### Option A: Using Supabase CLI

```bash
# Navigate to project root
cd /path/to/REALTORS-LEASERS

# Push the migration
supabase migration up

# Or specifically:
supabase db push supabase/migrations/20260205_enhance_user_sync.sql
```

#### Option B: Direct SQL Execution

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `supabase/migrations/20260205_enhance_user_sync.sql`
4. Execute the query
5. Verify success (should see ✅ notices)

### Step 2: Verify Database Changes

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Should return 1 row

-- 2. Check function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
-- Should return 1 row (or 2 if both old and new exist)

-- 3. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
-- Should have:
--   - users_manage_own_profile
--   - super_admin_view_all_users
--   - super_admin_update_users
--   - service_role_full_access

-- 4. Count users in profiles
SELECT COUNT(*) as user_count FROM public.profiles;
-- Should show your user count

-- 5. Verify user data sync
SELECT id, email, first_name, last_name, role, status FROM public.profiles LIMIT 5;
-- Should show user data properly populated
```

### Step 3: Deploy Frontend Changes

1. **Backup existing code** (optional but recommended)
   ```bash
   git checkout -b feature/user-sync-enhancement
   ```

2. **Verify new files exist:**
   - ✓ `src/services/api/userSyncService.ts` (NEW)
   - ✓ `src/components/portal/super-admin/UserManagementNew.tsx` (UPDATED)

3. **Install dependencies** (if needed):
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run tests** (if available):
   ```bash
   npm run test
   ```

### Step 4: Test in Development Environment

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to user management:**
   - Go to `/portal/super-admin/users`
   - Should see user list loading with sync status

3. **Check console logs** (F12):
   - Look for 🔄, ✅, and ❌ messages
   - Verify sync status shows users count
   - No errors should appear

4. **Test user operations:**
   - Search for users
   - Filter by role
   - Assign roles to unassigned users
   - Refresh user list

### Step 5: Production Deployment

1. **Create a production build:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting:**
   - If using Netlify: Push to main branch (auto-deploy)
   - If using Railway/Render: Push/trigger deploy
   - If using Docker: Build and push image

3. **Verify in production:**
   - Test user management on production
   - Monitor console for errors
   - Check browser network tab for API calls

## Rollback Plan

If issues occur, follow these steps:

### Option 1: Revert Component Only

If only the component is causing issues:

```bash
# Revert to previous version of UserManagementNew.tsx
git checkout HEAD~1 src/components/portal/super-admin/UserManagementNew.tsx

# Or restore from backup
cp src/components/portal/super-admin/UserManagementNew.tsx.backup src/components/portal/super-admin/UserManagementNew.tsx

# Rebuild and redeploy
npm run build
# Deploy as normal
```

### Option 2: Revert All Changes

If complete rollback is needed:

```bash
# Revert to previous state
git revert HEAD

# Or completely restore from backup
git checkout previous-branch

# Rebuild and redeploy
npm run build
# Deploy as normal
```

Note: The database changes are safe to keep - the trigger only fires on new user creation and is backward compatible.

## Troubleshooting Deployment

### Issue: Migration fails to run

**Solution:**
1. Check Supabase dashboard for errors
2. Verify RLS is temporarily disabled at start of migration
3. Run each section separately if needed
4. Check for existing policies/triggers

### Issue: Users not loading in dashboard

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check browser console (F12) for errors
3. Verify RLS policy allows super admin access
4. Check database has users in profiles table

### Issue: Service import error

**Solution:**
1. Verify userSyncService.ts exists in src/services/api/
2. Check import path is correct
3. Run `npm install` to refresh dependencies
4. Rebuild project

### Issue: Trigger not firing for new users

**Solution:**
1. Verify trigger exists in database
2. Check function exists and is valid
3. Test by creating new auth user and checking profiles table
4. Review database logs for errors

## Performance Considerations

Current setup:
- Loads all users on dashboard load
- Suitable for < 1000 users
- For larger user bases, consider pagination

For optimization:
```typescript
// Add pagination in future
const { data, count } = await supabase
  .from("profiles")
  .select("*", { count: "exact" })
  .range(0, 49)  // Load 50 at a time
  .order("created_at", { ascending: false });
```

## Monitoring After Deployment

### Key Metrics to Monitor

1. **User Dashboard Load Time**
   - Should be < 2 seconds
   - Check Network tab in DevTools

2. **Error Rate**
   - Monitor Sentry/error tracking
   - Check browser console for warnings

3. **Database Performance**
   - Check Supabase dashboard
   - Monitor query execution times

4. **User Complaints**
   - No missing users
   - No sync issues
   - Role assignments work correctly

## Documentation

After deployment, ensure:
- ✅ USER_SYNC_DOCUMENTATION.md is available
- ✅ USER_SYNC_QUICK_REFERENCE.md is available
- ✅ Team is informed of changes
- ✅ Developer notes are updated

## Success Criteria

Deployment is successful when:

- ✅ Users load in super admin dashboard
- ✅ User count matches auth.users count
- ✅ All roles display correctly
- ✅ Role assignments work
- ✅ No console errors
- ✅ RLS allows proper access
- ✅ Performance is acceptable

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] All users visible in dashboard
- [ ] User search works
- [ ] Role filtering works
- [ ] Role assignment works
- [ ] No console errors
- [ ] No network errors
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Monitoring set up

## Support Contacts

For deployment issues:
1. Check Supabase dashboard logs
2. Review browser console (F12)
3. Check network tab for API errors
4. Review migration logs

## Version Info

- **Migration:** 20260205_enhance_user_sync.sql
- **Service:** userSyncService.ts
- **Component:** UserManagementNew.tsx
- **Documentation:** USER_SYNC_DOCUMENTATION.md

---

**Last Updated:** February 5, 2025
**Status:** Ready for Deployment
