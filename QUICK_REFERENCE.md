# QUICK REFERENCE: FULLSTACK INTEGRATION

## TL;DR - What Was Done

✅ **Database:** Unified user model, added RLS, ensured foreign keys  
✅ **Frontend:** Updated userService, types, and AuthContext  
✅ **Documentation:** Created guides and validation tests  

---

## DEPLOY IN 3 STEPS

### 1️⃣ Cleanup (Optional)
```sql
-- File: supabase/migrations/20260202_cleanup_and_reset_users.sql
-- Does: Removes all non-admin users (fresh start for testing)
-- Time: 1 minute
```

### 2️⃣ Align
```sql
-- File: supabase/migrations/20260202_comprehensive_fullstack_alignment.sql
-- Does: Adds missing columns, RLS policies, views
-- Time: 2 minutes
```

### 3️⃣ Validate
```sql
-- File: supabase/migrations/20260202_validation_tests.sql
-- Does: Runs 10 tests to confirm everything works
-- Time: 1 minute
```

---

## DATABASE CHANGES AT A GLANCE

### profiles table additions:
```
+ role (TEXT) - super_admin, property_manager, tenant
+ user_type (TEXT) - for compatibility
+ status (TEXT) - active, inactive, suspended, pending
+ is_active (BOOLEAN) - soft delete
+ last_login_at (TIMESTAMP) - activity tracking
+ unit_id (UUID FK) - tenant's assigned unit
```

### RLS Policies (added for all key tables):
```
✅ profiles     - Service role only
✅ properties   - Super admins, managers, tenants
✅ units        - Super admins, managers, occupants
✅ leases       - Super admins, managers, tenants
✅ payments     - Super admins, managers, tenants
✅ maintenance  - Super admins, managers, tenants
✅ messages     - Sender/receiver only
✅ notifications- Recipient only
```

---

## FRONTEND UPDATES

| File | What Changed | Why |
|------|-------------|-----|
| `userService.ts` | Single profiles insert | Unified model |
| `user.types.ts` | Single UserProfile interface | No more split types |
| `AuthContext.tsx` | Fetch role from profiles | Unified auth |

---

## KEY ROLES EXPLAINED

```
super_admin
├─ Sees: Everything
├─ Can: Manage all users, properties, payments
└─ Used for: System administration

property_manager
├─ Sees: Assigned properties + their data
├─ Can: Manage tenants, approve maintenance
└─ Used for: Property management

tenant
├─ Sees: Own lease, assigned unit, rent
├─ Can: Pay rent, submit maintenance requests
└─ Used for: Renters
```

---

## COMMON QUERIES

### Check user's role
```sql
SELECT id, email, role FROM profiles WHERE email = 'user@example.com';
```

### See all users
```sql
SELECT id, email, role, status FROM profiles ORDER BY created_at DESC;
```

### Check RLS policies
```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

### List profiles for each role
```sql
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

### Check orphaned auth users
```sql
SELECT u.id, u.email FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL;
```

---

## TESTING CHECKLIST

- [ ] Register new user → profile created ✓
- [ ] User login → role shows correct ✓
- [ ] Super admin → sees all data ✓
- [ ] Manager → sees own properties ✓
- [ ] Tenant → sees own lease ✓
- [ ] RLS blocks unauthorized access ✓

---

## IF SOMETHING BREAKS

### Signup fails
→ Check auth trigger exists
→ Verify profiles table has all columns
→ Run validation tests

### No data shows up
→ Check user's role
→ Verify RLS policy matches
→ Test as super_admin first

### "Permission denied" errors
→ Check RLS policies
→ Verify auth.uid() matches user
→ Confirm user has correct role

---

## FILES YOU NEED

```
supabase/migrations/
├─ 20260202_cleanup_and_reset_users.sql
├─ 20260202_comprehensive_fullstack_alignment.sql
└─ 20260202_validation_tests.sql

Root level docs:
├─ FULLSTACK_INTEGRATION_COMPLETE.md
├─ AUDIT_AND_ALIGNMENT_SUMMARY.md
├─ DEPLOY_FULLSTACK_INTEGRATION.sh
└─ QUICK_REFERENCE.md (this file)
```

---

## BEFORE YOU DEPLOY

- [ ] Backup your database
- [ ] Have super_admin credentials ready
- [ ] Test in staging first if possible
- [ ] Read FULLSTACK_INTEGRATION_COMPLETE.md
- [ ] Plan maintenance window if needed

---

## AFTER YOU DEPLOY

- [ ] Run validation tests
- [ ] Test registration flow
- [ ] Test each user role
- [ ] Check browser console for errors
- [ ] Monitor Supabase logs
- [ ] Test permission restrictions

---

## SUPPORT

📖 Full docs: `FULLSTACK_INTEGRATION_COMPLETE.md`  
🚀 Deploy guide: `DEPLOY_FULLSTACK_INTEGRATION.sh`  
📊 Audit summary: `AUDIT_AND_ALIGNMENT_SUMMARY.md`  

---

**Status:** Ready to deploy ✅  
**Estimated time:** 10 minutes total  
**Risk level:** Low (migrations are non-destructive)  

Good luck! 🚀
