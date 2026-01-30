# Assign Ayden Homes Property to Property Manager

## Overview
This guide explains how to assign the "Ayden Homes" property to a property manager from the `profiles` table (roles).

## Database Structure
- **profiles table**: Stores user profiles with different roles (super_admin, property_manager, tenant, etc.)
- **properties table**: Stores property details with a `manager_id` field to link to a property manager

## Property Manager Roles Available
Property managers are identified by:
- `role = 'property_manager'` in the profiles table
- `status = 'active'` (optional filter)
- Have fields: `id`, `email`, `first_name`, `last_name`, `phone`

## Steps to Assign Ayden Homes

### Option 1: Using SQL (Recommended)
1. Open your **Supabase SQL Editor**
2. Navigate to: `ASSIGN_AYDEN_HOMES_TO_MANAGER.sql`
3. Copy the entire SQL script
4. Paste into Supabase SQL Editor
5. Click **Run**
6. The script will:
   - Find the first active property manager
   - Assign them to the Ayden Homes property
   - Display the assignment confirmation

### Option 2: Using the PropertyManager Component (UI)
1. Navigate to Super Admin Dashboard
2. Go to **Property Management** section
3. Find "Ayden Homes" in the properties table
4. Click the **Assign Manager** button (person + icon)
5. Select a property manager from the dropdown
6. Click the checkmark to confirm

### Option 3: Manual SQL Update
If you want to assign to a specific manager:

```sql
-- First, find available property managers
SELECT id, first_name, last_name, email 
FROM profiles 
WHERE role = 'property_manager' 
AND status = 'active';

-- Then update Ayden Homes with the chosen manager ID
UPDATE properties
SET manager_id = 'MANAGER_ID_HERE'
WHERE LOWER(name) = 'ayden homes';
```

## Verification
After assignment, verify in Supabase:

```sql
-- Check the assignment
SELECT 
  p.name,
  p.address,
  m.first_name,
  m.last_name,
  m.email,
  m.phone,
  p.manager_id
FROM properties p
LEFT JOIN profiles m ON p.manager_id = m.id
WHERE LOWER(p.name) = 'ayden homes';
```

Expected result:
- `name`: Ayden Homes
- `manager_id`: UUID of assigned manager
- Manager details should be populated

## Sample Property Managers (from seed data)
These are created by the migration scripts:

| Name | Email | Role |
|------|-------|------|
| John Kamau | john.kamau@example.com | property_manager |
| Sarah Wanjiku | sarah.wanjiku@example.com | property_manager |
| Peter Otieno | peter.otieno@example.com | property_manager |

## Troubleshooting

### Assignment didn't work?
1. Verify Ayden Homes property exists:
   ```sql
   SELECT * FROM properties WHERE LOWER(name) = 'ayden homes';
   ```

2. Verify property managers exist:
   ```sql
   SELECT id, first_name, last_name, role 
   FROM profiles 
   WHERE role = 'property_manager';
   ```

3. If no property managers exist, create one by running:
   ```sql
   INSERT INTO profiles (id, email, first_name, last_name, phone, role, status, avatar_url)
   VALUES (gen_random_uuid(), 'manager@example.com', 'Manager', 'Name', '+254...',  'property_manager', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager');
   ```

### Property not found?
- The script searches for properties where `name = 'ayden homes'` (case-insensitive)
- If Ayden Homes property doesn't exist, create it using the PropertyManager component's "Add Property" dialog

## Next Steps
After assignment:
1. The manager will see this property in their dashboard
2. The manager can manage units and tenants for this property
3. The super admin can view the assignment in the manager filter

---
**File Created**: ASSIGN_AYDEN_HOMES_TO_MANAGER.sql
**Last Updated**: January 30, 2026
