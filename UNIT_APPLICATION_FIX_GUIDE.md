# Unit Application Form - Fix & Setup Guide

## Issue
You're getting a **400 error** when trying to submit the unit application form. This is because the database columns required by the form haven't been created yet.

## Solution: Run the Database Migration

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your `KENYA-REALTORS` project
   - Click on "SQL Editor" in the left sidebar

2. **Create a New Query**
   - Click "New Query" button
   - Copy and paste the entire content from: `database/COMPLETE_LEASE_APPLICATIONS_SETUP.sql`
   
   > This file is in your project at: `c:\Users\korri\OneDrive\Desktop\KENYA-REALTORS-main\database\COMPLETE_LEASE_APPLICATIONS_SETUP.sql`

3. **Run the Migration**
   - Click the "Run" button (or press Ctrl + Enter)
   - Wait for the query to complete
   - You should see a success message and a table showing `lease_applications` with ~15+ columns

4. **Verify Success**
   - The final query in the migration will show you the column count
   - Should show something like: `lease_applications | 25` (or similar)

## What This Migration Does

✅ Adds all missing columns to the `lease_applications` table:
- applicant_name, physical_address, po_box
- applicant_email (already exists, skipped)
- employer_details, telephone_numbers, marital_status
- children_count, age_bracket, occupants_count
- next_of_kin, nationality, house_staff
- home_address, location, sub_location

✅ Makes applicant_id nullable (allows anonymous submissions)

✅ Enables Row Level Security (RLS) policies that:
- Allow anyone to submit applications
- Allow property managers to view applications for their properties
- Allow super admins to view all applications

✅ Grants proper permissions to anonymous and authenticated users

## Testing the Fix

After running the migration:

1. **Refresh Your App** - Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Try Submitting Again** - The form should now work
3. **Check Browser Console** - Should see no 400 errors
4. **Better Error Messages** - If there are issues, you'll see clearer error messages

## Error Codes Reference

If you still get errors after running the migration:

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| 42P01 | Table doesn't exist | Run the migration again |
| 42703 | Column doesn't exist | Run the migration again |
| PGRST116 | No rows found | Not an error for this use case |
| 403 Forbidden | Permission issue | Ensure RLS policies were created |
| 400 Bad Request | Malformed query | Check data types match (int vs string) |

## Still Having Issues?

1. **Clear Browser Storage**
   - Open DevTools (F12)
   - Application → Local Storage → Clear All
   - Reload the page

2. **Check Database in Supabase**
   - Go to Tables → `lease_applications`
   - Verify all columns exist with correct types:
     - TEXT columns: applicant_name, physical_address, etc.
     - INTEGER columns: children_count, occupants_count
     - BOOLEAN column: house_staff

3. **Review the Network Response**
   - Open DevTools → Network tab
   - Try submitting again
   - Click on the failed request
   - Check the Response tab for detailed error message

## Files Modified

✅ `src/components/UnitApplicationForm.tsx` - Improved error messages
✅ `database/COMPLETE_LEASE_APPLICATIONS_SETUP.sql` - Complete migration script

---

**Next Steps After Migration:**
1. Test the form submission
2. Monitor the browser console for errors
3. Check Supabase database to verify applications are being saved
4. Update any field validations if needed

