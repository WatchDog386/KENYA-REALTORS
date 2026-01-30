# Deployment Checklist - Security Hardening & RBAC

## Pre-Deployment Steps

### 1. Backup Supabase Data
```bash
# Export current database state (via Supabase UI or pg_dump if you have access)
# Ensure you have a recovery point in case rollback is needed
```

### 2. Review RLS Policies
```sql
-- Test that SuperAdmin can still access everything
SELECT * FROM profiles LIMIT 1; -- As SuperAdmin: should work
SELECT * FROM properties LIMIT 1; -- As SuperAdmin: should work
```

### 3. Clean Up Data Issues
```sql
-- Check for tenant duplicates BEFORE migration runs
SELECT user_id, COUNT(*) FROM tenants GROUP BY user_id HAVING COUNT(*) > 1;
-- If any results, manually delete duplicates (keep the active one)

-- Check for null unit_id / property_id mismatches
SELECT id, user_id, unit_id, property_id FROM tenants WHERE unit_id IS NULL OR property_id IS NULL;
-- Review and fix if needed
```

---

## Deployment

### Option A: Direct Supabase Console
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from `supabase/migrations/20260125_rls_hardening.sql`
3. Paste & **Run**
4. Watch for any errors (syntax, constraint violations)
5. If errors occur, rollback and debug

### Option B: Using Supabase CLI
```bash
cd /path/to/REALTORS-LEASERS

# Verify migration syntax
supabase migration validate

# Deploy
supabase migration deploy

# Monitor
supabase migration status
```

### Option C: Using Migrations in Code (Recommended)
```bash
# Ensure migration is in: supabase/migrations/20260125_rls_hardening.sql
# Then deploy via your CI/CD pipeline or:

npm run supabase:deploy  # If this command exists in your package.json
# or
supabase db push
```

---

## Post-Deployment Validation

### 1. Verify Policies Are Active
```sql
-- Check that RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Expected: rowsecurity = true for: profiles, properties, units, tenants, 
--           manager_assignments, payments, refunds, vacation_notices, 
--           approval_queue, approval_requests
```

### 2. Test SuperAdmin Access
```sql
-- As SuperAdmin user:
SET session auth.uid() = 'YOUR_SUPER_ADMIN_UUID';

-- Should all work:
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM properties;
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM payments;
```

### 3. Test Property Manager Access (Scoped)
```sql
-- As Property Manager user:
SET session auth.uid() = 'YOUR_MANAGER_UUID';

-- Should see only assigned properties:
SELECT COUNT(*) FROM properties;  
-- Compare to: SELECT COUNT(*) FROM properties WHERE NOT public.manager_has_property(id);

-- Should see only tenants in their properties:
SELECT COUNT(*) FROM tenants;
```

### 4. Test Tenant Access (Isolated)
```sql
-- As Tenant user:
SET session auth.uid() = 'YOUR_TENANT_UUID';

-- Should only see own record:
SELECT COUNT(*) FROM profiles;  -- Should be 1 (self)
SELECT COUNT(*) FROM tenants;    -- Should be 1 (self)
SELECT COUNT(*) FROM payments;   -- Should be 0 or their payment count only
```

### 5. Test Role Change Approval Flow
1. **Step 1:** Log in as unassigned user → go to /profile
2. **Step 2:** Select "Property Manager" role
3. **Step 3:** Should see: "Role request submitted for approval! A system administrator will review..."
4. **Step 4:** Check `approval_queue` table:
   ```sql
   SELECT * FROM approval_queue WHERE request_type = 'role_assignment' ORDER BY created_at DESC LIMIT 1;
   ```
   Should see pending request
5. **Step 5:** Log in as SuperAdmin
6. **Step 6:** Navigate to Approvals dashboard → approve the role request
7. **Step 7:** Check that user can now access manager dashboard
8. **Step 8:** Verify their `profiles.role` changed to `'property_manager'`

### 6. Test Tenant Addition Approval Flow
1. **Step 1:** SuperAdmin → User Management → Select user → Assign as Tenant
2. **Step 2:** Should see: "Role assignment request submitted for approval"
3. **Step 3:** Check `approval_queue`:
   ```sql
   SELECT * FROM approval_queue WHERE request_type = 'tenant_addition' ORDER BY created_at DESC LIMIT 1;
   ```
4. **Step 4:** Approve the request
5. **Step 5:** Verify `tenants` table has new record with status='active'

---

## Rollback (If Needed)

### Quick Rollback
```sql
-- Drop the new policies (revert to previous state)
-- This will revert to the last applied migration

-- If last working state was before 20260125:
-- Re-run the previous migration (e.g., 20250124_super_admin_fix.sql)

-- Alternative: Drop the problematic trigger/policies and re-enable old ones
DROP TRIGGER IF EXISTS trg_enforce_profile_role_on_insert ON public.profiles;
DROP TRIGGER IF EXISTS trg_enforce_profile_role_changes ON public.profiles;
DROP TRIGGER IF EXISTS trg_enforce_tenant_unit_property_match ON public.tenants;

-- Re-enable old (permissive) RLS if needed
-- Or use Supabase Point-in-Time Recovery (PITR) feature
```

### Supabase PITR Rollback (Safest)
1. Go to Supabase Dashboard → Database → Backups
2. Restore to point before migration (if PITR is enabled)
3. Re-test

---

## Monitoring Post-Deployment

### 1. Watch for RLS 403/Zero Results in Logs
```
Example error: {"code":"PGRST100","details":"permission denied"}
This is EXPECTED when:
- Non-SuperAdmin tries to read denied rows (should see zero rows, not error)
- Manager tries to access property they're not assigned to
- Tenant tries to read other tenants
```

### 2. Check Approval Queue Volume
```sql
SELECT COUNT(*) as pending_approvals FROM approval_queue WHERE status = 'pending';
SELECT COUNT(*) as daily_approvals FROM approval_queue WHERE created_at >= NOW() - INTERVAL '1 day';
```
Monitor for unusual spikes or stuck requests.

### 3. Audit Trail
```sql
-- See who requested what approvals
SELECT 
  aq.id, 
  aq.request_type, 
  p.email as requested_by, 
  aq.status, 
  aq.created_at 
FROM approval_queue aq
JOIN profiles p ON aq.requested_by = p.id
ORDER BY aq.created_at DESC
LIMIT 20;
```

### 4. Failed API Requests
Monitor your frontend logs for:
- 403 Forbidden (permission denied)
- Zero-row responses when rows expected (check RLS filter)
- Approval submission failures (check trigger errors)

---

## What Should Happen (Expected Behavior)

### For SuperAdmins
✅ Can view/edit all records  
✅ Can approve/reject all requests  
✅ See full audit trail  

### For Managers
✅ Can only see assigned properties  
✅ Can see tenants only in their properties  
✅ Cannot directly add/remove tenants (need approval)  
✅ Cannot modify other managers' properties  

### For Tenants
✅ Can only see their own profile  
✅ Can only see their lease/unit/property  
✅ Can see their own payments and refund status  
✅ Cannot see other tenants' information  

---

## Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "permission denied" 403 on SELECT | RLS policy doesn't match user role | Verify `is_super_admin()`, `manager_has_property()` functions work |
| Role change request not appearing | `approval_queue` RLS too restrictive | Check `approval_queue_insert_own` policy |
| Manager can't see any properties | Missing `manager_assignments` record | Create manager_assignments with status='active' |
| Tenant can see other tenants | RLS policy still too broad | Revert to previous migration and reapply 20260125 |
| Constraint violation on tenant insert | Duplicate user_id or mismatched property_id | Run cleanup queries above, then retry |

---

## Final Checklist

- [ ] Backup database
- [ ] Review migration for conflicts
- [ ] Deploy migration
- [ ] Test SuperAdmin access
- [ ] Test Manager scoped access
- [ ] Test Tenant isolation
- [ ] Test role change approval flow
- [ ] Test tenant addition approval flow
- [ ] Monitor logs for 403 errors (expected, OK)
- [ ] Verify audit trail working
- [ ] Document any custom policies/functions added by your team
- [ ] Update team documentation on new approval workflows
- [ ] Schedule follow-up review (1 week post-deployment)

---

**All systems ready. Safe to deploy!**
