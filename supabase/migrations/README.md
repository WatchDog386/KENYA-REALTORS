# Database Migrations - January 30, 2026

This folder contains all SQL migrations needed to set up the REALTORS-LEASERS database schema.

## Essential Migrations (in order)

1. **20260125_rls_hardening.sql** - Row Level Security hardening
   - Secures database access with RLS policies
   - Sets up role-based permissions

2. **20260129_add_mock_data.sql** - Test/mock data
   - Adds sample properties, users, and transactions
   - Useful for development and testing

3. **20260129_tenant_portal_setup.sql** - Tenant portal tables
   - Creates tenant-specific tables and views
   - Sets up tenant dashboard functions

4. **20260130_add_email_confirmation.sql** - Email verification
   - Adds email confirmation workflow
   - Authentication improvements

5. **20260130_create_storage_buckets.sql** - Cloud storage
   - Sets up Supabase storage buckets
   - Document and image storage configuration

6. **20260130_create_user_function.sql** - User creation function
   - Database function for user provisioning
   - Ensures data consistency

7. **20260130_fix_profiles_rls.sql** - Profiles RLS fixes
   - Fixes any RLS policy issues
   - Ensures secure profile access

8. **20260130_property_units_restructure.sql** - Property structure
   - Restructures property/units relationship
   - Final schema optimization

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to "SQL Editor"
3. Click "New Query"
4. Copy and paste the contents of each migration file in order
5. Execute each migration and verify success

### Option 2: Using Supabase CLI

```bash
supabase db push
```
5. Click "Run"
6. Verify no errors appear

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
supabase db push
```

## Important Notes

### Tables Created

- `profiles` - User profiles with roles (super_admin, property_manager, tenant, owner, maintenance, accountant)
- `properties` - Property listings with manager and admin assignments
- `leases` - Lease agreements between tenants and properties
- `payments` - Payment records for rent and other fees
- `maintenance_requests` - Maintenance ticket system
- `audit_logs` - Activity logging for compliance
- `manager_assignments` - Property manager assignments

### Security Features

- All tables have Row Level Security (RLS) enabled
- Policies restrict users to viewing only their own data (with super_admin exceptions)
- Audit logging tracks all changes

### Default Roles

- **super_admin**: Full system access
- **property_manager**: Manage assigned properties and tenants
- **tenant**: View own leases and payments
- **owner**: Own properties, manage them
- **maintenance**: Handle maintenance requests
- **accountant**: Financial records (optional)

## Seed Data

To add test data, you can use the following SQL:

```sql
-- Create a super admin test user
INSERT INTO profiles (id, email, first_name, last_name, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    'Admin',
    'User',
    'super_admin',
    'active'
);

-- Create a test property
INSERT INTO properties (name, address, city, state, zip_code, type, status, total_units, manager_id, super_admin_id)
VALUES (
    'Test Property',
    '123 Main St',
    'Nairobi',
    'KE',
    '00100',
    'apartment',
    'active',
    5,
    NULL,
    '00000000-0000-0000-0000-000000000001'
);
```

## Rollback

If you need to rollback a migration, you can drop tables (though this will delete data):

```sql
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS manager_assignments CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

## Troubleshooting

### "UNIQUE constraint violation" on email

- The `profiles.email` field is unique. Check for duplicate emails.

### "Foreign key constraint violation"

- Ensure referenced records exist. For example, don't create a lease without a valid tenant_id and property_id.

### RLS policy preventing access

- Check that the user has the correct role in the profiles table
- Verify the RLS policy allows the operation
- Super admins can bypass most policies

## Support

For issues with migrations, check:

1. Supabase logs for detailed error messages
2. RLS policies are correctly configured
3. All dependencies exist (foreign keys)
4. User has proper authentication with Supabase Auth

---

**Last Updated**: January 15, 2025
