# Fix for Infinite Recursion (Error 42P17) on Profiles Table

## Issue Description
You are encountering an infinite recursion error (`42P17`) when the application tries to fetch the user profile.
This is caused by a Row Level Security (RLS) policy on the `profiles` table that refers to the `profiles` table itself in a way that creates an endless loop.

Specifically, the policy checking for "Super Admin" status queryies the `profiles` table:
```sql
CREATE POLICY "super_admin_all_access" 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'...));
```
When this policy runs, it triggers a select on `profiles`, which triggers the policy again, ad infinitum.

## The Fix
We have created a new migration file `supabase/migrations/20260205_fix_infinite_recursion_final.sql`.
This fix:
1.  **Creates a `SECURITY DEFINER` function `is_super_admin()`**. This function runs with elevated privileges (bypassing RLS) to safely check if a user is an admin without triggering the recursion.
2.  **Drops the recursive policies.**
3.  **Re-creates policies** using the safe `is_super_admin()` function.

## How to Apply
1.  Go to your Supabase Dashboard -> SQL Editor.
2.  Open the file `supabase/migrations/20260205_fix_infinite_recursion_final.sql` in VS Code.
3.  Copy the entire content.
4.  Paste it into the Supabase SQL Editor.
5.  Click **Run**.

Once applied, the `42P17` error will disappear, and the application will load the user profile correctly.
