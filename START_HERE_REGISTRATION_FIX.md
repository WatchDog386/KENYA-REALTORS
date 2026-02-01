# ⚡ REGISTRATION FIX - QUICK START (2 Minutes)

## 🔴 ERROR You're Getting
```
POST /auth/v1/signup → 500 (Internal Server Error)
"Database error saving new user"
```

## 🟢 SOLUTION (3 Things)
1. ✅ Fix RLS circular logic
2. ✅ Update auth trigger to SECURITY DEFINER
3. ✅ Simplify registration code

## ⏱️ TIME TO FIX
- **SQL migration:** 5 minutes
- **Testing:** 10 minutes  
- **Total:** 15 minutes

---

## 🚀 DO THIS NOW

### Step 1: Run SQL (5 min)
```
1. Go to Supabase Dashboard
2. Click "SQL Editor" 
3. Create "New query"
4. Copy entire contents of: RUN_THIS_SQL.sql
5. Paste it
6. Click "Run"
7. Wait for success message
```

### Step 2: Test Registration (5 min)
```
1. Open your app
2. Go to Register page
3. Select "Tenant / Looking to Rent"
4. Fill form with test data
5. Click "Create Account"
6. Should see: "Awaiting property manager verification" ✅
```

### Step 3: Verify in Database (5 min)
```
Supabase Table Editor → Check:
✅ auth.users     → New record exists
✅ profiles       → status='pending'
✅ approval_requests → type='tenant_verification' exists
✅ units_detailed → status='reserved'
```

---

## 📄 WHAT TO READ

| Document | Time | Why |
|----------|------|-----|
| `REGISTRATION_FIX_SUMMARY.md` | 5 min | Understand the fix |
| `WORKFLOW_DIAGRAMS.md` | 5 min | See it visually |
| `RUN_THIS_SQL.sql` | 5 min | The actual fix |

---

## ✅ SUCCESS LOOKS LIKE

- [x] No 500 error during registration
- [x] Profile created automatically
- [x] Can't login (status pending) ✅ This is correct!
- [x] Property manager gets notification
- [x] Console shows clear debug logs

---

## 🆘 QUICK HELP

**Q: Still getting 500 error?**
A: The SQL migration might not have run. Run it again and look for error messages.

**Q: Profile not created?**
A: Check Supabase logs. The trigger might be failing. Check if RLS is enabled.

**Q: Can't see approval request?**
A: Make sure `approval_requests` table exists. If not, run the migration first!

---

## 🎯 WHAT HAPPENS NEXT

1. Property Manager sees notification in their dashboard
2. Manager reviews tenant information
3. Manager clicks "Approve"
4. Profile status changes to 'active'
5. Tenant can now login ✅

(Same for Property Manager → Super Admin approval)

---

**Ready? Start with Step 1 above! 🚀**
