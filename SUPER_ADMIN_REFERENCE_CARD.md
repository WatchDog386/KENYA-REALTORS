# SUPER ADMIN - QUICK REFERENCE CARD

## 📋 USER CREDENTIALS

```
Email:    duncanmarshel@gmail.com
Password: Marshel@1992
Role:     super_admin
Access:   FULL SYSTEM CONTROL
```

---

## 🚀 3-STEP SETUP

### STEP 1️⃣: SUPABASE AUTH
```
1. Go to https://app.supabase.com
2. Auth > Users > Add user
3. Email: duncanmarshel@gmail.com
4. Password: Marshel@1992
5. ✓ Auto confirm email
6. COPY the User ID (UUID)
```

### STEP 2️⃣: DATABASE SQL
```
1. Edit: CREATE_SUPER_ADMIN_USER.sql
2. Replace {USER_ID} with your UUID
3. Go to SQL Editor > New Query
4. Paste & Run the script
```

### STEP 3️⃣: TEST LOGIN
```
1. npm run dev
2. Go to: http://localhost:5173/login
3. Enter credentials from above
4. Verify: Redirects to /portal/super-admin/dashboard
```

---

## ✅ VERIFICATION QUERIES

**Check user exists:**
```sql
SELECT id, email FROM auth.users 
WHERE email = 'duncanmarshel@gmail.com';
```

**Check profile exists:**
```sql
SELECT id, email, role, status, is_active 
FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';
```

**All super admins:**
```sql
SELECT id, email, role FROM public.profiles 
WHERE role = 'super_admin';
```

---

## 🔑 PERMISSIONS

Super admin has **ALL permissions** including:
- ✅ Manage all properties
- ✅ Manage all users
- ✅ Manage all leases
- ✅ Manage all payments
- ✅ Approve all requests
- ✅ Configure all settings
- ✅ View all analytics
- ✅ View all audit logs

---

## 📍 ACCESSIBLE ROUTES

```
/portal/super-admin/dashboard          → Main dashboard
/portal/super-admin/properties         → Property management
/portal/super-admin/users              → User management
/portal/super-admin/approvals          → Approval queue
/portal/super-admin/analytics          → Analytics
/portal/super-admin/settings           → System settings
/portal/super-admin/leases             → Lease management
/portal/super-admin/payments           → Payment management
/portal/super-admin/manager            → Manager portal
/portal/super-admin/profile            → Profile management
/portal/super-admin/refunds            → Refund tracking
```

---

## 🐛 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Login fails | Verify user created in Supabase Auth |
| Access denied | Check role = 'super_admin' in profiles table |
| Wrong redirect | Verify role is super_admin AND is_active = true |
| SQL error | Make sure {USER_ID} replaced with actual UUID |
| Still not working | Clear cache, check console (F12) for errors |

---

## 📁 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `CREATE_SUPER_ADMIN_USER.sql` | SQL setup script |
| `SUPER_ADMIN_SETUP_GUIDE.md` | Detailed guide |
| `SUPER_ADMIN_QUICK_CHECKLIST.md` | Step-by-step checklist |
| `setup-super-admin-windows.bat` | Windows helper script |

---

## 🔍 DATABASE STRUCTURE

```
Supabase Auth (auth.users)
    ↓ Email/Password
Public Profiles (public.profiles)
    ↓ Role: super_admin
Routes/Permissions
    ↓ Full Access
SuperAdminDashboard
```

---

## 💾 SQL TEMPLATE

Replace `{USER_ID}` with actual UUID:

```sql
INSERT INTO public.profiles (
  id, email, first_name, last_name, full_name,
  role, user_type, status, is_active,
  email_confirmed, email_confirmed_at, created_at, updated_at
) VALUES (
  '{USER_ID}',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'Duncan Marshel',
  'super_admin',
  'super_admin',
  'active',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  user_type = 'super_admin',
  status = 'active',
  is_active = true,
  updated_at = NOW();
```

---

## 🎯 EXPECTED BEHAVIOR

After successful setup:

1. **Login Page** → Accept credentials
2. **Dashboard** → Redirects to `/portal/super-admin/dashboard`
3. **Sidebar** → Shows all admin menu items
4. **Navigation** → Can access all admin pages
5. **Actions** → Can create, edit, delete entities
6. **Permissions** → No restrictions (super_admin)

---

## 🔐 SECURITY REMINDERS

⚠️ **IMPORTANT:**
- Change password after first login
- Keep credentials secure
- Monitor audit logs
- Document access
- Create backup super admin
- Use strong passwords

---

## 📞 QUICK CONTACTS

- **Supabase**: https://supabase.com/docs
- **Auth Docs**: See `src/contexts/AuthContext.tsx`
- **Error Logs**: Browser console (F12)

---

## ✨ FEATURES INCLUDED

✅ Full user management  
✅ Property management  
✅ Financial tracking  
✅ Request approvals  
✅ Analytics & reports  
✅ System configuration  
✅ Audit logging  
✅ Role-based access  

---

**Status**: ✅ READY TO IMPLEMENT  
**Time Required**: ~12 minutes  
**Difficulty**: Easy  
