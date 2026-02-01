# User Cleanup Execution Checklist

## ✅ Pre-Cleanup Verification
- [ ] You have superadmin access to Supabase
- [ ] You know your superadmin email address (to identify which user to keep)
- [ ] Your dev server is running
- [ ] You have a backup (if needed)

---

## ✅ Step 1: Database Cleanup

### Option A: Run the Script (Recommended - Windows)
- [ ] Open Command Prompt or PowerShell
- [ ] Navigate to project root: `cd c:\Users\korri\OneDrive\Desktop\REALTORS-LEASERS`
- [ ] Run: `cleanup-users.bat`
- [ ] When prompted "Type 'yes' to confirm:", type `yes` and press Enter
- [ ] Script runs the migration
- [ ] ✅ Database cleanup complete

### Option B: Run the Script (Mac/Linux)
- [ ] Open Terminal
- [ ] Navigate to project root: `cd ~/Desktop/REALTORS-LEASERS`
- [ ] Run: `bash cleanup-users.sh`
- [ ] When prompted "Type 'yes' to confirm:", type `yes` and press Enter
- [ ] Script runs the migration
- [ ] ✅ Database cleanup complete

### Option C: Manual Database Cleanup
- [ ] Go to: https://supabase.com/dashboard/project/rcxmrtqgppayncelonls/sql/new
- [ ] Copy entire content from: `supabase/migrations/20260202_cleanup_and_reset_users.sql`
- [ ] Paste into the SQL editor
- [ ] Click the "Run" button (or Ctrl+Enter)
- [ ] See message: "Database cleanup complete"
- [ ] ✅ Database cleanup complete

---

## ✅ Step 2: Delete Auth Users (Manual - Must Do This!)

**Important:** Supabase requires manual deletion. This step cannot be automated.

- [ ] Go to Supabase Dashboard: https://supabase.com/dashboard
- [ ] Select your project: `REALTORS-LEASERS` (or similar)
- [ ] Click on "Authentication" in left menu
- [ ] Click on "Users" tab
- [ ] You should see a list of users
- [ ] **For EACH non-superadmin user:**
  - [ ] Click on the user row to select it
  - [ ] Click the three-dot menu (⋮) or "Delete user" button
  - [ ] Confirm deletion when prompted
  - [ ] Wait for user to disappear from list
- [ ] Repeat until only superadmin remains
- [ ] ✅ Auth users cleaned up

---

## ✅ Step 3: Clear Browser Storage

This logs you out completely and removes old session tokens.

### Chrome/Edge/Firefox/Brave:
- [ ] Press `F12` to open DevTools
- [ ] Click "Application" tab (at the top) 
  - If you don't see it, try clicking `>>` to expand tabs
- [ ] In left sidebar, click "Local Storage"
- [ ] Click on "http://localhost:8080" or similar
- [ ] Look for entries like:
  - `supabase-auth-token`
  - `supabase-session`
  - `auth-` (anything with auth)
- [ ] Right-click each entry → "Delete"
- [ ] Alternatively: Right-click any entry → "Clear all"
- [ ] Close DevTools (F12 again)
- [ ] Refresh page (Ctrl+R or F5)
- [ ] ✅ Browser storage cleared

### Safari:
- [ ] Press `Cmd+Option+I` to open DevTools
- [ ] Click "Storage" tab
- [ ] Click "Local Storage"
- [ ] Click "http://localhost:8080"
- [ ] Delete supabase-related entries
- [ ] ✅ Browser storage cleared

---

## ✅ Step 4: Restart Development Server

- [ ] Look at your terminal running the dev server
- [ ] Press `Ctrl+C` to stop it
- [ ] Wait for it to fully stop (you should see a prompt return)
- [ ] Run one of these commands:
  ```bash
  bun run dev
  # OR
  npm run dev
  ```
- [ ] Wait for it to say something like "Local: http://localhost:8080"
- [ ] ✅ Dev server restarted

---

## ✅ Step 5: Verify Cleanup

### In Supabase Dashboard:
1. Go to SQL Editor → New Query
2. Run this query:
   ```sql
   SELECT COUNT(*) as profile_count FROM public.profiles;
   SELECT * FROM public.profiles;
   ```
3. Should show: 1 row (only superadmin)
4. [ ] ✅ Database cleanup verified

### In Your Browser:
1. Go to `http://localhost:8080` (refresh if already open)
2. Should see Login/Register page (NOT logged in)
3. Should NOT see "Database error finding user" anywhere
4. [ ] ✅ Frontend cleanup verified

### Check Auth System:
1. Go to Supabase → Authentication → Users
2. Should show only 1 user (superadmin)
3. [ ] ✅ Auth system cleanup verified

---

## ✅ Step 6: Test New User Registration

Now test that new registrations work:

- [ ] On your app, click "Register" or "Sign Up"
- [ ] Fill in registration form:
  - Email: `test@example.com` (use a NEW email)
  - Password: `TestPassword123!`
  - Other fields as needed
- [ ] Click "Register" button
- [ ] Wait a few seconds
- [ ] ✅ Should complete WITHOUT "Database error finding user"
- [ ] You might get a confirmation email message
- [ ] Try to log in with the new account
- [ ] ✅ Should log in successfully
- [ ] Check that profile was created in Supabase:
  ```sql
  SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] ✅ New profile exists

---

## ✅ Step 7: Verify Superadmin Still Works

- [ ] Log out (if logged in as test user)
- [ ] Go back to login page
- [ ] Log in as superadmin with your original account
- [ ] Check that superadmin dashboard works
- [ ] [ ] ✅ Superadmin functionality verified

---

## 🎉 CLEANUP COMPLETE!

All steps done? You're ready to go! 

**Summary of what happened:**
- ✅ Deleted all non-superadmin users from database
- ✅ Deleted all non-superadmin users from auth
- ✅ Cleared browser tokens and sessions
- ✅ Restarted development server
- ✅ Verified cleanup worked
- ✅ Tested new user registration works

**Next Steps:**
- New user registrations should work without errors
- All new profiles will be created automatically
- Database and auth are in sync
- Ready for development/testing

---

## ❌ Troubleshooting If Something Goes Wrong

### "Still getting 'Database error finding user'"
- [ ] Did you run the SQL migration? Re-run it
- [ ] Did you delete users from Supabase Auth? Check again
- [ ] Did you clear browser storage? Try again (F12 → Application → Local Storage)
- [ ] Did you restart dev server? Try: Ctrl+C, then restart

### "Can't find delete button for users in Supabase"
- [ ] Make sure you're in: Authentication → Users
- [ ] Look for three-dot menu (⋮) on the user row
- [ ] Or look for "Remove user" or "Delete user" option
- [ ] If still stuck: Check Supabase docs or contact support

### "Still only seeing 'Database error' message"
- [ ] Open DevTools (F12)
- [ ] Check Console tab for exact error message
- [ ] Look at the network request to see what Supabase returned
- [ ] Check if profiles table is empty (should have superadmin)
- [ ] Check if auth.users matches profiles (should match)

### "Script won't run on Windows"
- [ ] Try right-click → "Run as Administrator"
- [ ] Or open PowerShell as admin and run: `cleanup-users.bat`
- [ ] Or follow "Manual Steps" instead

### "I need to undo this!"
Unfortunately, **this is not reversible without a backup**. 
- The deleted users and profiles cannot be recovered
- You would need to restore from a database backup
- In future, always keep backups before destructive operations

---

## Need Help?

**Checklist not clear?**
- Read: `CLEANUP_USERS_GUIDE.md` (detailed version)
- Read: `CLEANUP_QUICK_START.md` (quick summary)

**Specific error?**
- Check the "Troubleshooting" section above
- Check browser console (F12 → Console tab)
- Check Supabase dashboard for system status

**Still stuck?**
- Post error message in chat
- Include: exact error, what step you're on, what you tried
