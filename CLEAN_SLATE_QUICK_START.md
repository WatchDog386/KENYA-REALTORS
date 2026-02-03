# CLEAN SLATE IMPLEMENTATION - QUICK START

## What's Changed

### ✅ COMPLETED
1. **Registration Form Updated** - No longer asks for property/unit selection
   - Only collects: Full Name, Email, Phone, Account Type, Password
   - File: [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)

2. **Auth Context Verified** - Already handles role=NULL on signup
   - File: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

3. **Database Migration Created** - Sets up clean slate and super admin
   - File: [supabase/migrations/20260203_clean_slate_user_assignment.sql](supabase/migrations/20260203_clean_slate_user_assignment.sql)

4. **Documentation Complete** - Full guides created
   - [CLEAN_SLATE_IMPLEMENTATION_GUIDE.md](CLEAN_SLATE_IMPLEMENTATION_GUIDE.md)
   - [DATABASE_ALIGNMENT_CLEAN_SLATE.md](DATABASE_ALIGNMENT_CLEAN_SLATE.md)

### 🔄 NEXT STEPS (Will Be Done)
1. Update UserManagementNew.tsx with "Unassigned Users" tab
2. Verify assignment workflow integration
3. Test end-to-end flow

---

## How to Test

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor, copy and paste:
# supabase/migrations/20260203_clean_slate_user_assignment.sql
# Then click "Run" button
```

### Step 2: Verify Super Admin
```sql
SELECT email, role, status FROM profiles WHERE email = 'duncanmarshel@gmail.com';
-- Should return: duncanmarshel@gmail.com | super_admin | active
```

### Step 3: Test Registration
1. Open http://localhost:5173/register (or your dev URL)
2. Fill form:
   - Full Name: John Doe
   - Phone: +254 712 345 678
   - Email: testuser@example.com
   - Account Type: Tenant (or Property Manager)
   - Password: test123456
3. Submit
4. Should see: "Awaiting administrator approval"
5. Check database:
   ```sql
   SELECT email, role, status FROM profiles WHERE email = 'testuser@example.com';
   -- Should return: testuser@example.com | NULL | pending
   ```

### Step 4: Test Super Admin Assignment
1. Login as duncanmarshel@gmail.com
2. Go to Admin Dashboard
3. Should see "User Management"
4. Should see new testuser@example.com in "Unassigned Users" (once UserManagementNew.tsx is updated)
5. Click "Assign" button
6. If Tenant selected:
   - Choose property
   - Choose unit (vacant only)
   - Confirm
7. Check database:
   ```sql
   SELECT email, role, status FROM profiles WHERE email = 'testuser@example.com';
   -- Should return: testuser@example.com | tenant | active
   ```

### Step 5: Test User Login
1. Logout
2. Login as testuser@example.com
3. Should see tenant dashboard (once assignment is complete)

---

## Database Changes Summary

### profiles table
**New behavior:**
- `role` defaults to NULL (instead of being set at signup)
- `status` starts as 'pending' (instead of 'active')
- `user_type` stores what they registered as (for reference)
- Users can only login after super admin sets role and status='active'

### Key Fields:
```
role: NULL → (super admin assigns) → 'tenant' | 'property_manager' | 'super_admin'
status: 'pending' → (super admin approves) → 'active'
user_type: What they registered as ('tenant', 'property_manager')
```

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER SIGNUP                              │
│  Email, Password, Name, Phone, Account Type                 │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Profile Created:    │
        │ role = NULL        │
        │ status = pending   │
        └────────┬────────────┘
                 │
        "Awaiting Admin Approval"
                 │
                 ▼
        ┌──────────────────────────────┐
        │   SUPER ADMIN DASHBOARD      │
        │ View: Unassigned Users       │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │   SUPER ADMIN ASSIGNS:       │
        │ 1. Select user               │
        │ 2. Choose role               │
        │ 3. For tenant: Pick unit     │
        │ 4. For manager: Pick props   │
        │ 5. Confirm                   │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Profile Updated:    │
        │ role = assigned    │
        │ status = active    │
        └────────┬────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │   USER CAN NOW LOGIN         │
        │ Dashboard (Tenant/Manager)   │
        └──────────────────────────────┘
```

---

## Key Files

### Modified
- [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx) - Registration form
  
### Created
- [supabase/migrations/20260203_clean_slate_user_assignment.sql](supabase/migrations/20260203_clean_slate_user_assignment.sql) - Database setup
- [CLEAN_SLATE_IMPLEMENTATION_GUIDE.md](CLEAN_SLATE_IMPLEMENTATION_GUIDE.md) - Full implementation guide
- [DATABASE_ALIGNMENT_CLEAN_SLATE.md](DATABASE_ALIGNMENT_CLEAN_SLATE.md) - Database alignment

### To Update (Next)
- [src/components/portal/super-admin/UserManagementNew.tsx](src/components/portal/super-admin/UserManagementNew.tsx)
  - Add "Unassigned Users" tab
  - Update assignment form to work with new flow
  
---

## Verification Checklist

✅ Registration form simplified (no property/unit)
✅ New users get role=NULL, status='pending'
✅ Super admin account ready (duncanmarshel@gmail.com)
✅ Database migration prepared
✅ Auth context already compatible
⏳ UserManagement UI to be updated
⏳ Full end-to-end testing

---

## What's Different from Before

| Aspect | Before | After |
|--------|--------|-------|
| **Registration Form** | Asks for property/unit | Only basic info |
| **Role Assignment** | User chooses | Super admin assigns |
| **Unit Assignment** | User chooses | Super admin assigns |
| **Initial Status** | Active | Pending (awaiting approval) |
| **Can Login** | Immediately | After assignment only |
| **Super Admin Role** | Any admin | Only duncanmarshel@gmail.com |

---

## Troubleshooting

### "Profile was not created"
→ Run the migration to fix RLS policies

### "Super admin not found"
→ Create duncanmarshel@gmail.com in Supabase Auth first, then run migration

### "Can't see Unassigned Users"
→ UserManagementNew.tsx UI still needs updating (next step)

### "User can't login"
→ Check profile: is role set? is status='active'?

---

## Next Immediate Steps

1. Run the database migration in Supabase
2. Test registration and verify database changes
3. Update UserManagementNew.tsx component
4. Test assignment workflow
5. Test user login to correct dashboard

See [CLEAN_SLATE_IMPLEMENTATION_GUIDE.md](CLEAN_SLATE_IMPLEMENTATION_GUIDE.md) for detailed steps.
