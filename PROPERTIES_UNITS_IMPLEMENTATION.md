# Properties & Units Enhancement Implementation Guide

## Overview
This document describes the complete implementation of the properties table enhancement with unit/house information, enabling tenants to register for specific units rather than just providing free-text house numbers.

## Database Schema

### Key Tables

#### 1. **properties** (Enhanced)
- `id` (UUID) - Primary key
- `name` - Property name
- `address`, `city`, `state`, `country`, `postal_code` - Location
- `property_type` - Type (apartment, house, commercial, etc.)
- `status` - Status (active, inactive, maintenance)
- `total_units` - Total number of units in property
- `occupied_units` - Currently occupied units
- `available_units` - Vacant units
- `monthly_rent` - Base rent
- `security_deposit` - Standard deposit
- `property_manager_id` - FK to profiles (manager responsible for this property)
- `description`, `amenities` - Additional info

#### 2. **unit_specifications**
- `id` (UUID) - Primary key
- `property_id` - FK to properties
- `unit_type_name` - e.g., "1-Bedroom", "Studio", "2-Bedroom"
- `unit_category` - residential/commercial
- `total_units_of_type` - How many of this type exist
- `occupied_count`, `vacant_count`, `maintenance_count` - Status breakdown
- `base_price` - Monthly rent for this unit type
- `available_floors` - Array of floors where available
- `features`, `amenities` - Unit type features
- `utilities_included` - JSONB with water/electricity/wifi flags

#### 3. **units_detailed**
- `id` (UUID) - Primary key
- `property_id` - FK to properties
- `unit_specification_id` - FK to unit_specifications
- `unit_number` - e.g., "Unit 5", "House 123", "Apt 4B"
- `unit_type` - Descriptive type
- `floor_number` - Floor level
- `size_sqft` - Size in square feet
- `price_monthly` - Monthly rent
- `price_deposit` - Deposit amount
- `occupant_id` - FK to profiles (current tenant)
- `status` - vacant/occupied/maintenance/reserved
- `features` - Array of unit features
- `created_at`, `updated_at` - Timestamps

#### 4. **profiles** (Extended)
```
- Added fields for tenant registration mapping:
  - unit_id (FK to units_detailed) - Current unit
  - property_id (FK to properties) - Current property
  - Removed: house_number (now uses unit_id)
```

#### 5. **tenant_verifications**
- Maps tenants to units they registered for
- `tenant_id` - FK to profiles
- `unit_id` - FK to units_detailed (new, was house_number)
- `house_number` - Stored for reference
- `property_id` - FK to properties
- `status` - pending/verified/rejected
- Property managers use this to approve tenants

#### 6. **manager_approvals**
- `id` (UUID) - Primary key
- `manager_id` - FK to profiles
- `managed_properties` - Array of property names
- `status` - pending/approved/rejected
- Super admins approve managers here

#### 7. **notifications**
- `id` (UUID) - Primary key
- `recipient_id` - FK to profiles (who receives it)
- `sender_id` - FK to profiles (who triggered it)
- `type` - tenant_verification/manager_approval
- `related_entity_type` - tenant/manager
- `related_entity_id` - ID of tenant/manager
- `title`, `message` - Notification content
- `read_at` - When notification was read
- `created_at` - Timestamp

## Migration Files

### 1. `20260130_property_units_restructure.sql`
- Creates `unit_specifications` table for unit type definitions
- Creates `units_detailed` table for individual units
- Creates `property_income_projections` table
- Creates comprehensive indexes for performance
- Sets up Row-Level Security (RLS) policies
- Includes utility functions for calculating occupancy

### 2. `20260131_add_tenant_manager_fields.sql`
- Adds columns to `profiles` table:
  - `unit_id` - Unit tenant is registered for
  - `property_id` - Property reference
- Creates `tenant_verifications` table for approval workflow
- Creates `manager_approvals` table for super admin approvals
- Creates `notifications` table for system notifications
- Sets up RLS policies for all tables
- Creates notification utility functions

### 3. `20260131_add_mock_properties_and_units.sql`
- Populates 5 realistic properties
- Creates 9 unit specifications across different types
- Creates 21 individual unit instances
- Includes units with different occupancy statuses
- Mock data for testing tenant registration flow

## Frontend Implementation

### 1. **RegisterPage.tsx** - Tenant Registration Form
```typescript
// Key Changes:
- Added Unit interface with id, unit_number, unit_type, floor_number, price_monthly
- Added availableUnits state
- Added handlePropertySelect() - fetches vacant units when property selected
- Changed form validation to use unitId instead of houseNumber
- Updated handleRegister() to:
  - Reserve unit (mark as occupied)
  - Store unit_id in profiles
  - Create tenant_verification with unit info
  - Notify property manager

// Form Flow:
1. User selects role (tenant/property_manager/owner)
2. Tenant selects property
3. System loads available vacant units for that property
4. Tenant selects specific unit
5. System displays unit details (type, floor, price)
6. Tenant submits registration
7. Unit status changed to "reserved"
8. Manager notification sent with unit details
```

### 2. **PropertyManager.tsx** - Super Admin Property Management
```typescript
// Enhancements:
- Table now displays:
  - Unit Details: Total units, occupied count, vacant count
  - Occupancy: Visual progress bar and percentage
  - Property Manager: Assigned manager info
- Shows unit information breakdown per property
- Enhanced statistics including occupancy metrics

// Displays:
- Total properties, units, and revenue
- Occupancy rate and breakdown
- Available managers for assignment
```

### 3. **TenantVerificationPanel.tsx** - Property Manager Approval
```typescript
// Shows:
- List of pending tenant registrations
- Unit information for each tenant
- Approve/reject actions
- Sends notifications to tenants

// Data Flow:
- Fetches tenant_verifications where status = 'pending'
- Displays unit details from units_detailed
- Updates verification status on approve/reject
- Creates notifications for tenants
```

### 4. **ManagerApprovalPanel.tsx** - Super Admin Approval
```typescript
// Shows:
- List of pending manager registrations
- Properties manager wants to manage
- Approve/reject actions
- Sends notifications to managers

// Data Flow:
- Fetches manager_approvals where status = 'pending'
- Updates profile role on approval
- Creates notifications
```

## Key Workflows

### Workflow 1: Tenant Registration & Verification
```
1. Tenant Registration
   ├─ Selects property
   ├─ System loads vacant units
   ├─ Tenant selects specific unit
   ├─ Fills registration form
   └─ Submits

2. Database Updates (on registration)
   ├─ Create auth user
   ├─ Create profile with unit_id and property_id
   ├─ Update unit status: vacant → reserved
   ├─ Update unit occupant_id
   ├─ Create tenant_verification record
   └─ Create notification for manager

3. Manager Verification
   ├─ Manager views TenantVerificationPanel
   ├─ Reviews tenant info and unit details
   ├─ Approves or rejects
   ├─ If approved:
   │  ├─ Update tenant_verifications.status = verified
   │  ├─ Update unit status: reserved → occupied
   │  ├─ Update tenant profile status: pending → active
   │  ├─ Create approval notification for tenant
   │  └─ Tenant can now access portal
   └─ If rejected:
      ├─ Update tenant_verifications.status = rejected
      ├─ Update unit status: reserved → vacant
      └─ Create rejection notification

4. Tenant Portal Access
   └─ Tenant logs in and accesses their unit info and payments
```

### Workflow 2: Property Manager Approval
```
1. Manager Registration
   ├─ Fills form
   ├─ Selects properties to manage
   └─ Submits

2. Database Updates
   ├─ Create auth user
   ├─ Create profile with role = property_manager (pending)
   ├─ Create manager_approvals record
   └─ Create notification for super admin

3. Super Admin Approval
   ├─ Admin views ManagerApprovalPanel
   ├─ Reviews properties and manager info
   ├─ Approves or rejects
   └─ If approved:
      ├─ Update manager_approvals.status = approved
      ├─ Update profile.role = active_property_manager
      ├─ Update profile.status = active
      ├─ Create approval notification
      └─ Manager can access portal

4. Manager Portal Access
   └─ Manager logs in, views tenants, processes approvals
```

### Workflow 3: Owner/Super Admin Registration
```
- Owner/Super admin roles don't require verification
- Created directly as active users
- Can immediately access their portals
```

## Data Flow: One Tenant Per Unit

### The Complete Flow:
```
Registration Phase:
  Tenant registers for Unit 5 at Westside Apartments
    ↓
  profiles.unit_id = "uuid-of-unit-5"
  profiles.property_id = "uuid-of-westside"
  units_detailed(uuid-of-unit-5).status = "reserved"
  units_detailed(uuid-of-unit-5).occupant_id = tenant_user_id
    ↓
  tenant_verifications record created
  Manager notified

Verification Phase:
  Manager approves tenant
    ↓
  tenant_verifications.status = "verified"
  profiles.status = "active"
  units_detailed(uuid-of-unit-5).status = "occupied"

Active Phase:
  Tenant can now:
    - View their unit details (via profiles.unit_id)
    - See unit history and info
    - Process payments
    - Communicate with manager

Audit Trail:
  - Can always trace: unit → occupant → profile
  - Can always trace: profile → current unit via unit_id
  - Can always trace: unit → previous occupants via move-out dates
```

## API/Database Queries

### Get Available Units for Property
```sql
SELECT * FROM units_detailed
WHERE property_id = $1 AND status = 'vacant'
ORDER BY unit_number;
```

### Get Tenant Info with Unit Details
```sql
SELECT 
  p.*,
  ud.unit_number,
  ud.unit_type,
  ud.floor_number,
  ud.price_monthly,
  pr.name as property_name,
  pr.address
FROM profiles p
LEFT JOIN units_detailed ud ON p.unit_id = ud.id
LEFT JOIN properties pr ON p.property_id = pr.id
WHERE p.id = $1;
```

### Get Pending Verifications for Manager
```sql
SELECT 
  tv.*,
  p.full_name,
  p.email,
  p.phone,
  ud.unit_number,
  ud.unit_type,
  ud.floor_number,
  ud.price_monthly
FROM tenant_verifications tv
JOIN profiles p ON tv.tenant_id = p.id
LEFT JOIN units_detailed ud ON tv.unit_id = ud.id
WHERE tv.property_id = $1 AND tv.status = 'pending'
ORDER BY tv.created_at DESC;
```

### Update Unit Status After Verification
```sql
UPDATE units_detailed
SET status = 'occupied', updated_at = NOW()
WHERE id = $1;

UPDATE profiles
SET status = 'active', updated_at = NOW()
WHERE id = $2;
```

## Implementation Checklist

- [x] Database migrations created
  - [x] Property units restructure
  - [x] Tenant/manager fields
  - [x] Mock data population
- [x] RegisterPage.tsx updated
  - [x] Unit interface added
  - [x] Available units fetch logic
  - [x] Unit selection UI
  - [x] Form validation for units
  - [x] Registration handler updated
- [x] PropertyManager.tsx enhanced
  - [x] Unit details display
  - [x] Occupancy visualization
  - [x] Enhanced table layout
- [x] Approval panels functional
  - [x] TenantVerificationPanel
  - [x] ManagerApprovalPanel
- [x] Notification system
  - [x] Notification creation
  - [x] Notification display
- [ ] Testing
  - [ ] Run database migrations
  - [ ] Test tenant registration
  - [ ] Test manager approval workflow
  - [ ] Test tenant verification
  - [ ] Verify unit status updates
- [ ] Deployment
  - [ ] Run migrations on production
  - [ ] Verify data integrity
  - [ ] Update documentation

## Testing Scenarios

### Test 1: Tenant Registration
```
1. Register as tenant
2. Select "Westside Apartments"
3. Verify units load (should show: Unit A1, Unit A2, etc.)
4. Select "Unit A1 - 1-Bedroom (KES 15000/mo)"
5. Complete registration
6. Check: profiles.unit_id is set
7. Check: units_detailed status = reserved
8. Check: notifications sent to manager
```

### Test 2: Manager Verification
```
1. Log in as property manager for Westside
2. View TenantVerificationPanel
3. See pending tenant registration
4. View unit details: Unit A1, 1-Bedroom, Floor 1
5. Approve tenant
6. Check: unit status = occupied
7. Check: tenant profile status = active
8. Verify tenant can now log in
```

### Test 3: Property Manager Approval
```
1. Register as property manager
2. Select properties to manage
3. Submit registration
4. Check: Super admin sees pending approval
5. Super admin approves
6. Check: Manager profile status = active
7. Manager can now log in
```

## Common Issues & Solutions

### Issue: "No units available" when registering as tenant
**Solution**: Ensure mock data migration ran successfully and properties have vacant units

### Issue: Unit status not updating
**Solution**: Check RLS policies and profile permissions in tenant_verifications/units_detailed

### Issue: Manager not receiving notifications
**Solution**: Verify property_manager_id is set on property and notifications table has correct recipient

### Issue: Duplicate units showing
**Solution**: Check for duplicate inserts in units_detailed table

## Next Steps

1. **Run migrations** on development database
2. **Test tenant registration flow** end-to-end
3. **Verify unit status tracking** through approvals
4. **Test property manager dashboard** with real data
5. **Deploy to production** with backup
6. **Monitor notifications** and approval workflows
7. **Gather user feedback** on UI/UX

## Support & Documentation

- See [AUTH_WORKFLOW.md](AUTH_WORKFLOW.md) for complete authentication flow
- See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for full schema documentation
- See [REGISTRATION_WORKFLOW.md](REGISTRATION_WORKFLOW.md) for detailed workflows

---
Last Updated: January 31, 2026
Version: 1.0
