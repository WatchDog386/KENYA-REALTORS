# User Cleanup - Quick Reference

## The Problem
- User logged in but no profile created
- Getting "Database error finding user" on signup
- Need to clear all users except superadmin

## The Solution
Created 3 cleanup resources:

### 1. **SQL Migration** 
📁 `supabase/migrations/20260202_cleanup_and_reset_users.sql`
- Deletes all non-superadmin profiles
- Cleans related tables (notifications, approvals, etc.)
- Preserves superadmin

### 2. **Windows Script**
📁 `cleanup-users.bat`
```bash
cleanup-users.bat
```
- Runs the migration automatically
- Guides you through manual steps

### 3. **Bash Script**
📁 `cleanup-users.sh`
```bash
bash cleanup-users.sh
```
- Same as above, for Mac/Linux

---

## How to Use (Choose One Method)

### METHOD A: Use the Script (Easiest)
**Windows:**
```bash
cleanup-users.bat
```

**Mac/Linux:**
```bash
bash cleanup-users.sh
```

### METHOD B: Manual Steps (if script doesn't work)

**Step 1 - Database Cleanup:**
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy content from: `supabase/migrations/20260202_cleanup_and_reset_users.sql`
4. Click Run

**Step 2 - Delete Auth Users:**
1. Go to Supabase → Authentication → Users
2. Delete all users EXCEPT superadmin
3. Only superadmin should remain

**Step 3 - Clear Browser:**
1. Press F12 (DevTools)
2. Application → Local Storage → http://localhost:8080
3. Delete entries with "supabase" in the name
4. Or just clear all site data

**Step 4 - Restart:**
```bash
# Press Ctrl+C to stop server
# Then restart:
bun run dev
```

---

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Users** | Multiple auth users | Only superadmin |
| **Profiles** | Mismatched auth/profiles | All in sync |
| **Browser** | Old session tokens | Cleared |
| **New Signups** | "Database error" | Works! ✅ |

---

## Test It

1. Go to registration page
2. Create new user account
3. Should complete successfully
4. Should be able to log in immediately

---

## Full Documentation
👉 See `CLEANUP_USERS_GUIDE.md` for detailed step-by-step instructions

---

## Important Notes

⚠️ **This is destructive** - All non-superadmin users are deleted permanently

✅ **Safe** - Superadmin is preserved

✅ **All properties remain** - Only user data is deleted

✅ **Ready for testing** - Fresh start with clean database

---

## Where's the Error From?

The registration error happened because:
1. Auth user created in `auth.users`
2. But no profile in `public.profiles`
3. Supabase looked for profile → not found → 500 error
4. The migration fixes this by syncing both tables

---

## After Cleanup

New users will:
- Create auth account ✅
- Create profile automatically ✅
- Log in successfully ✅
- No more database errors ✅
