# Database Migration Instructions

## 📋 File to Execute

The following SQL migration file has been created and needs to be executed in your Supabase database:

**File**: `database/20260226_add_utility_constants.sql`

## 🚀 How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `database/20260226_add_utility_constants.sql`
6. Click **Run**

### Option 2: Copy-Paste Content

```sql
-- Add utility constants table to store metering configuration
CREATE TABLE IF NOT EXISTS public.utility_constants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utility_name VARCHAR(100) NOT NULL UNIQUE,
    constant DECIMAL(10, 4) DEFAULT 1,
    is_metered BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for utility_constants
ALTER TABLE public.utility_constants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage utility constants"
    ON public.utility_constants FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Everyone can view utility constants"
    ON public.utility_constants FOR SELECT
    USING (TRUE);

-- Add fields to utility_settings for backward compatibility
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS water_constant DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS electricity_constant DECIMAL(10, 4) DEFAULT 1;

-- Insert default utility constants
INSERT INTO public.utility_constants (utility_name, constant, is_metered, description)
VALUES 
    ('Electricity', 1, TRUE, 'Metered utility - rate per unit'),
    ('Water', 1, TRUE, 'Metered utility - rate per unit'),
    ('Garbage', 1, FALSE, 'Fixed fee - not metered'),
    ('Security', 1, FALSE, 'Fixed fee - not metered'),
    ('Service', 1, FALSE, 'Fixed fee - not metered')
ON CONFLICT (utility_name) DO NOTHING;

-- Add dynamic utilities JSONB column if not exists
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
```

## ✅ Verification

After running the migration, verify it was successful:

1. Go to Supabase Dashboard → **SQL Editor** → Run this query:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'utility_constants';
```

Should return: `utility_constants`

2. Check the columns:

```sql
SELECT * FROM public.utility_constants LIMIT 1;
```

Should show columns: `id, utility_name, constant, is_metered, description, created_at, updated_at, custom_data`

3. Check default utilities:

```sql
SELECT utility_name, constant, is_metered FROM public.utility_constants;
```

Should return:
```
Electricity  | 1 | true
Water        | 1 | true
Garbage      | 1 | false
Security     | 1 | false
Service      | 1 | false
```

## 🔍 Tables Modified

### New Table Created:
- `utility_constants` - Stores utility definitions with their multiplier constants

### Existing Tables Modified:
- `utility_settings` - Added columns:
  - `water_constant` (DECIMAL)
  - `electricity_constant` (DECIMAL)

## 👤 Permissions Applied

Two policies are created for `utility_constants`:

1. **"Superadmin can manage utility constants"**
   - Only users with `role = 'superadmin'` can INSERT, UPDATE, DELETE

2. **"Everyone can view utility constants"**
   - All authenticated users can SELECT

This ensures:
- ✅ SuperAdmin can manage constants
- ✅ Everyone can see and use constants
- ✅ Only SuperAdmin can change them

## ⚠️ Important Notes

- **If migration fails**: Check that `utility_settings` table exists first
- **If utility_constants already exists**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't error
- **If conflicts occur**: Use `DELETE FROM public.utility_constants; TRUNCATE public.utility_constants;` to clear and retry
- **Rollback**: If needed, run: `DROP TABLE IF EXISTS public.utility_constants CASCADE;`

## 📊 After Migration

The app can now:
- ✅ SuperAdmin sets and manages utility constants
- ✅ Property Managers fetch and use these constants
- ✅ Add custom utilities dynamically
- ✅ Calculate bills correctly using formulas

## 🎯 Next Steps

1. ✅ Run the migration (you're reading the instructions)
2. ✅ Restart your application (or Next.js/Vite dev server)
3. ✅ Go to SuperAdmin → Utility Management
4. ✅ Configure your utility constants
5. ✅ Property Managers can now use them

---

**Status**: Ready to Deploy
**Testing**: Build succeeded with no errors
**Backwards Compatible**: Yes - uses `IF NOT EXISTS` clauses
