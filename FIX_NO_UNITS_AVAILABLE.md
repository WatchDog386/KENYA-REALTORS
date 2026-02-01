# ⚠️ Fix: No Units Available - Run These Migrations

## The Issue
You're seeing "No units available" when registering as a tenant because the database migrations haven't been executed yet.

## The Solution: Run the Migrations

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**

### Step 2: Copy and Execute These Migrations (IN ORDER)

**Migration 1 - Run First:**
Go to: `supabase/migrations/20260130_property_units_restructure.sql`
- Copy the entire file content
- Paste into SQL Editor
- Click **"Run"** button
- Wait for success ✅

**Migration 2 - Run Second:**
Go to: `supabase/migrations/20260131_add_tenant_manager_fields.sql`
- Copy the entire file content
- Paste into SQL Editor
- Click **"Run"** button
- Wait for success ✅

**Migration 3 - Run Third:**
Go to: `supabase/migrations/20260131_add_mock_properties_and_units.sql`
- Copy the entire file content
- Paste into SQL Editor
- Click **"Run"** button
- Wait for success ✅

### Step 3: Verify the Data

**Check if units were created:**
```sql
SELECT COUNT(*) as total_units FROM units_detailed;
```
Should return: **21**

**Check if properties exist:**
```sql
SELECT COUNT(*) as total_properties FROM properties;
```
Should return: **5**

**Check vacant units:**
```sql
SELECT unit_number, unit_type, status FROM units_detailed 
WHERE status = 'vacant' LIMIT 10;
```
Should return units like:
- Unit 101 | Studio | vacant
- Unit 102 | Studio | vacant
- Unit 103 | 1-Bedroom | vacant
- etc.

## Step 4: Test in Application

1. Go to registration page (`/register`)
2. Select "Tenant / Looking to Rent"
3. Select "Westside Apartments" (or any property)
4. **Now the unit dropdown should populate with available units** ✅

## What's New in the UI

### Email Confirmation Message ✅
After registration, you'll now see:
- ✅ "Registration successful! Please check your email to confirm your account."
- 📧 "We've also sent your details to the property manager for verification."

This is because Supabase automatically sends a confirmation email when you sign up.

### Better Unit Loading Feedback ✅
- **Loading state:** "Loading available units..."
- **No units message:** "⚠️ No vacant units available. Please contact the property manager or select another property."
- **Unit details display:** Shows the selected unit type and floor

## Still No Units After Migrations?

If you still see no units:

1. **Check if migrations ran successfully:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('properties', 'units_detailed', 'unit_specifications')
   LIMIT 5;
   ```
   Should show all 3 tables

2. **Check if units are actually there:**
   ```sql
   SELECT 
     p.name as property_name, 
     COUNT(u.id) as unit_count,
     COUNT(CASE WHEN u.status = 'vacant' THEN 1 END) as vacant_units
   FROM properties p
   LEFT JOIN units_detailed u ON p.id = u.property_id
   GROUP BY p.id, p.name;
   ```

3. **If migrations failed, check the error:** Look for red error messages in Supabase SQL Editor

## Troubleshooting

**Issue:** Migrations show errors
**Solution:** Make sure you're running them **in order** (1, 2, then 3). Don't skip steps.

**Issue:** Still getting "No units available"
**Solution:** Refresh the page and try again. Sometimes the data takes a moment to sync.

**Issue:** Units show but can't select them
**Solution:** Clear browser cache (Ctrl+Shift+Delete) and reload.

## Need Help?

- See [QUICK_START_UNITS.md](QUICK_START_UNITS.md) for more details
- See [VERIFICATION_CHECKLIST_UNITS.md](VERIFICATION_CHECKLIST_UNITS.md) for testing
- Check browser console (F12) for any error messages

---

**After running migrations, units should appear immediately!** ✅

**The mock data includes:**
- ✅ 5 properties (Westside Apartments, Downtown Plaza, etc.)
- ✅ 21 individual units (studios, 1-bed, 2-bed)
- ✅ Mix of vacant and occupied units
- ✅ Ready to test tenant registration

Start testing now! 🎉
