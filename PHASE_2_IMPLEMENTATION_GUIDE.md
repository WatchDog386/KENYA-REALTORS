# Phase 2 Implementation - Complete Restructuring Guide

## Overview
Complete redesign of User Management and Property Management systems with:
- Simplified user workflow via profiles table
- Complex multi-unit property management with specifications
- Automated income projections
- SuperAdmin-centric role assignment

## New Components Created

### 1. **UserManagementNew.tsx**
**Location:** `src/components/portal/super-admin/UserManagementNew.tsx`

**Key Features:**
- **Profiles-Based Workflow:** All users stored in `profiles` table
- **Two-Tab Interface:**
  - Unassigned Users: New signups and pending approvals
  - Assigned Users: Users with roles (property_manager, super_admin, accountant, maintenance)
- **Role Assignment:** SuperAdmin can assign roles to any unassigned user
- **User Creation:** SuperAdmin can manually create users with roles
- **Status Management:** Control user status (active, suspended, pending)
- **Real-Time Stats:** Dashboard cards showing:
  - Total users, unassigned, assigned
  - Breakdown by role (super_admin, property_manager, tenant)

**User Flow:**
```
New User Signs Up → Stored in profiles (role=null or role=tenant)
                 → Appears in "Unassigned Users" tab
                 → SuperAdmin Reviews
                 → SuperAdmin Assigns Role (property_manager, super_admin, etc.)
                 → User Moves to "Assigned Users" tab
                 → Role-Based Access Granted
```

**Database Integration:**
- Reads from: `profiles` table
- Uses views: `unassigned_users`, `assigned_users`
- Updates: `role`, `status` columns in profiles
- Supports: Email verification via Supabase Auth

### 2. **PropertyManagementNew.tsx**
**Location:** `src/components/portal/super-admin/PropertyManagementNew.tsx`

**Key Features:**
- **Property Management:**
  - Create properties with basic info (name, address, city, type)
  - Support multiple property types (apartment, commercial, house, mixed-use)
  - Automatic calculation of unit counts

- **Unit Specifications:**
  - Pre-defined unit types (Bedsitter, 1-Bedroom, 2-Bedroom, Studio, Shop)
  - For each unit type:
    - Total number of units of that type
    - Base monthly rent price
    - Size variants (configurable)
    - Available floors

- **Income Projections:**
  - Real-time calculation of expected monthly income
  - Based on: Total units × Monthly rent per unit type
  - Shows per-unit-type breakdown
  - Supports occupancy rate adjustments

- **Dashboard Stats:**
  - Total properties and units
  - Current occupancy percentage
  - Total monthly income (full capacity)
  - Projected monthly income (current occupancy)

- **Unit Type Configuration:**
  - Bedsitter: Small self-contained units (typically 300-400 sqft)
  - 1-Bedroom: One bedroom with separate living area
  - 2-Bedroom: Two bedrooms with kitchen and living area
  - Studio: Single open-plan unit
  - Shop: Commercial units for retail/business

**Database Integration:**
- Writes to: `properties`, `unit_specifications`
- Reads from: `property_income_projections`
- Triggers: Auto-calculate income via `calculate_property_income()` function
- RLS: SuperAdmin-only access to sensitive data

**Property Creation Flow:**
```
SuperAdmin Clicks "Add Property" → Property Form Opens
                                  → Fill basic info (name, address, city, type)
                                  → Configure unit types:
                                      - Set count per type
                                      - Set base price per type
                                      - Configure size variants
                                  → System Calculates Expected Income
                                  → Click "Create Property"
                                  → Database Stores:
                                      - Property record
                                      - Unit specifications per type
                                      - Income projections
                                  → Property appears in list with stats
```

## Migration Steps

### Step 1: Apply Database Migration
File: `supabase/migrations/20260130_property_units_restructure.sql`

**Execute in Supabase SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `20260130_property_units_restructure.sql`
4. Click "Run"

**Verify Success:**
```sql
-- Check new tables exist
SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('unit_specifications', 'units_detailed', 'property_income_projections');

-- Check views exist
SELECT * FROM unassigned_users LIMIT 5;
SELECT * FROM assigned_users LIMIT 5;

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname IN ('calculate_property_income', 'update_property_unit_counts');
```

### Step 2: Update App.tsx Routing
Replace old PropertyManagement imports with new component:

```tsx
// OLD
import PropertyManager from "@/components/portal/super-admin/PropertyManager";

// NEW
import PropertyManagementNew from "@/components/portal/super-admin/PropertyManagementNew";

// In routes, change:
<Route path="property-manager" element={<PropertyManagementNew />} />
```

Similarly for UserManagement:
```tsx
// OLD
import UserManagement from "@/components/portal/super-admin/UserManagement";

// NEW
import UserManagementNew from "@/components/portal/super-admin/UserManagementNew";

// In routes, change:
<Route path="user-management" element={<UserManagementNew />} />
```

### Step 3: Test New Components

**UserManagement Testing:**
1. Login as super_admin
2. Go to User Management
3. Verify "Unassigned Users" tab shows any pending users
4. Create a new test user via "Add User" button
5. Assign role to test user (should move to Assigned tab)
6. Verify role assignment works

**PropertyManagement Testing:**
1. Go to Property Management
2. Click "Add Property"
3. Fill in test property:
   - Name: "Test Apartments"
   - Address: "Test Street"
   - City: "Nairobi"
   - Type: "Apartment"
4. Add unit types:
   - Bedsitter: 10 units @ 15,000 KES
   - 1-Bedroom: 5 units @ 25,000 KES
5. Click "Create Property"
6. Verify property appears in list
7. Check stats show:
   - 2 unit types
   - 15 total units
   - Expected monthly income: (10×15,000) + (5×25,000) = 275,000 KES

## Data Structure Overview

### profiles table (existing, enhanced)
```sql
- id (primary key)
- email
- first_name
- last_name
- phone
- role (NULL | 'tenant' | 'property_manager' | 'super_admin' | 'accountant' | 'maintenance')
- status ('active' | 'suspended' | 'pending')
- avatar_url
- created_at
- updated_at
- last_login_at
```

### unit_specifications table (NEW)
```sql
- id (primary key)
- property_id (foreign key → properties)
- unit_type_name ('Bedsitter' | '1-Bedroom' | '2-Bedroom' | 'Studio' | 'Shop')
- unit_category ('residential' | 'commercial')
- total_units_of_type (integer)
- base_price (monthly rent)
- size_variants (JSONB: [{name, sqft, price}, ...])
- available_floors (array of floor numbers)
- features (array: ['air_conditioning', 'internet', ...])
- amenities (array: ['gym', 'parking', 'security', ...])
- utilities_included (array: ['water', 'electricity', ...])
- created_at
- updated_at
```

### units_detailed table (NEW)
```sql
- id (primary key)
- property_id (foreign key → properties)
- unit_specification_id (foreign key → unit_specifications)
- unit_number (string, e.g., "A101", "B205")
- unit_type (string, inherited from spec)
- floor_number (integer)
- size_sqft (integer)
- price_monthly (decimal)
- occupant_id (foreign key → profiles, nullable)
- status ('vacant' | 'occupied' | 'maintenance' | 'reserved')
- move_in_date (timestamp, nullable)
- move_out_date (timestamp, nullable)
- created_at
- updated_at
```

### property_income_projections table (NEW)
```sql
- id (primary key)
- property_id (foreign key → properties)
- total_units (integer)
- total_monthly_income (decimal) - all units, full occupancy
- income_breakdown (JSONB: {unit_type: total_income, ...})
- expected_occupancy_rate (percentage: 0-100)
- projected_monthly_income (decimal) - based on occupancy rate
- annual_projected_income (decimal) - 12 × projected_monthly_income
- last_updated (timestamp)
- created_at
- updated_at
```

### Views Created

**unassigned_users View:**
- Returns all users with:
  - role IS NULL OR role = 'tenant'
  - status = 'pending' OR status IS NULL
- Used by UserManagementNew to show "Unassigned Users" tab

**assigned_users View:**
- Returns all users with:
  - role IN ('property_manager', 'super_admin', 'accountant', 'maintenance')
  - status = 'active'
- Used by UserManagementNew to show "Assigned Users" tab

## Automatic Calculations

### Income Calculation (Trigger: trigger_unit_specs_income)
When unit_specifications are added/modified:
1. Calculate total_monthly_income = SUM(units_of_type × base_price per type)
2. Calculate income_breakdown = {unit_type: count × price, ...}
3. Calculate projected_monthly_income = total_income × (occupancy_rate / 100)
4. Calculate annual = projected_monthly × 12
5. Store in property_income_projections table

### Unit Count Update (Trigger: trigger_units_detailed_update)
When units_detailed are added/modified:
1. Update properties.total_units = COUNT(units for property)
2. Update properties.occupied_units = COUNT(units with occupant_id IS NOT NULL)
3. Update properties.vacancy_rate = (vacant / total) × 100

## Key Improvements Over Old System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| **User Source** | Multiple tables, complex logic | Single `profiles` table |
| **User Status** | Scattered, inconsistent | Centralized in `status` column |
| **Role Assignment** | Not clearly defined | SuperAdmin-only, explicit approval |
| **Property Structure** | Simple unit count | Complex: types → specifications → units |
| **Unit Types** | Not defined | Pre-configured (5 standard types) |
| **Size Variants** | Not supported | JSONB array with multiple sizes per type |
| **Pricing** | Fixed per property | Per type + per variant |
| **Income Calc** | Manual | Automatic via triggers |
| **Income Projections** | Not available | Stored in dedicated table, auto-updated |
| **Floor Info** | Not tracked | Per-unit floor number |
| **Unit Details** | Minimal | Comprehensive (occupant, move dates, status) |

## Files to Delete (Optional - can clean up later)

After thoroughly testing new components, consider deleting old files:
- `src/components/portal/super-admin/PropertyManager.tsx` (old property management)
- `src/components/portal/super-admin/UserManagement.tsx` (old user management) - only after UserManagementNew is fully tested

⚠️ **WARNING:** Do NOT delete until:
1. All routes updated in App.tsx
2. All features tested in new components
3. Data migration from old structure verified (if applicable)
4. SuperAdmin team trained on new interface

## Rollback Plan

If issues occur, you can:

1. **Keep old components available:**
   - Rename new components to have "Prod" suffix
   - Keep old components accessible via feature flag

2. **Database rollback:**
   ```sql
   -- Drop new tables (data will be lost)
   DROP TABLE IF EXISTS property_income_projections CASCADE;
   DROP TABLE IF EXISTS units_detailed CASCADE;
   DROP TABLE IF EXISTS unit_specifications CASCADE;
   
   -- Drop new views
   DROP VIEW IF EXISTS unassigned_users CASCADE;
   DROP VIEW IF EXISTS assigned_users CASCADE;
   
   -- Drop new functions
   DROP FUNCTION IF EXISTS calculate_property_income CASCADE;
   DROP FUNCTION IF EXISTS update_property_unit_counts CASCADE;
   ```

3. **Restore old routes in App.tsx**

## Next Steps

1. ✅ Database migration created
2. ⏳ Apply migration to Supabase
3. ⏳ Update App.tsx routes
4. ⏳ Test UserManagementNew thoroughly
5. ⏳ Test PropertyManagementNew thoroughly
6. ⏳ Train SuperAdmin on new workflows
7. ⏳ Delete old components (once confident)
8. ⏳ Update documentation and runbooks
9. ⏳ Monitor for issues in production

---

**Status:** Phase 2 Component Implementation Complete ✅
**Created:** January 30, 2026
**Components:** 2 new (UserManagementNew, PropertyManagementNew)
**Database:** Migration file ready for application

