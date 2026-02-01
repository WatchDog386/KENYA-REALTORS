# ⚡ EXECUTE CLEANUP NOW

## 🚀 Start Here (Pick Your Platform)

### Windows Users
```bash
cleanup-users.bat
```
- Opens automatically
- Follow on-screen instructions
- Takes ~5 minutes

### Mac/Linux Users
```bash
bash cleanup-users.sh
```
- Opens automatically
- Follow on-screen instructions
- Takes ~5 minutes

---

## If Scripts Don't Work

### Manual Approach (5 steps)

#### Step 1: Database Cleanup
```
Supabase Dashboard → SQL Editor → New Query
↓
Copy: supabase/migrations/20260202_cleanup_and_reset_users.sql
↓
Paste into SQL editor
↓
Click Run
```

#### Step 2: Delete Auth Users (Manual)
```
Supabase Dashboard → Authentication → Users
↓
For each non-superadmin user:
  - Click user
  - Click Delete user
  - Confirm
↓
Only superadmin should remain
```

#### Step 3: Clear Browser
```
Press F12 (Open DevTools)
↓
Application → Local Storage → http://localhost:8080
↓
Delete entries with "supabase" in name
↓
Close DevTools (F12)
↓
Refresh page (Ctrl+R)
```

#### Step 4: Restart Server
```
Press Ctrl+C in terminal (stop server)
↓
Run: bun run dev
↓
Wait for "Local: http://localhost:8080"
```

#### Step 5: Test
```
Go to: http://localhost:8080
↓
Register with new email
↓
Should complete without "Database error"
```

---

## Verification

### Quick Check
```sql
SELECT COUNT(*) FROM public.profiles;
-- Should show: 1 (only superadmin)
```

### Full Check
```sql
SELECT * FROM public.profiles;
-- Should show only superadmin
```

---

## That's It!

✅ Users cleaned up
✅ Only superadmin remains
✅ New registrations work
✅ Ready to test

---

## Troubleshooting

**"Database error finding user" still showing?**
- Did you run SQL migration? Re-run it
- Did you delete auth.users? Check Supabase Auth
- Did you clear browser? Try again: F12 → Local Storage
- Did you restart server? Try: Ctrl+C, then restart

**"Can't find Delete button?"**
- Go to: Supabase → Authentication → Users
- Look for user row
- Click three-dot menu (⋮)
- Select Delete user

**"Still stuck?"**
- Read: CLEANUP_USERS_GUIDE.md (detailed)
- Read: CLEANUP_CHECKLIST.md (step-by-step)

---

## Files Reference

```
cleanup-users.bat                          ← Use on Windows
cleanup-users.sh                           ← Use on Mac/Linux
CLEANUP_CHECKLIST.md                       ← Use while executing
CLEANUP_USERS_GUIDE.md                     ← Detailed guide
CLEANUP_QUICK_START.md                     ← Quick reference
supabase/migrations/
  20260202_cleanup_and_reset_users.sql     ← The SQL
```

---

## Go! 🚀

### Windows:
```bash
cleanup-users.bat
```

### Mac/Linux:
```bash
bash cleanup-users.sh
```

Follow the prompts. Done in 5 minutes!
