# System Verification Checklist

## What Has Been Implemented

### Database Level
✅ **unit_specifications table** - Stores unit type definitions (1-Bed, Studio, 2-Bed, etc.)
✅ **units_detailed table** - Individual unit records with status tracking (vacant/occupied/reserved)
✅ **profiles enhancements** - Added unit_id and property_id columns for tenant mapping
✅ **tenant_verifications table** - Tracks pending tenant registrations linked to specific units
✅ **manager_approvals table** - Tracks pending manager registrations for approval
✅ **notifications table** - System notifications for all approval workflows

### Frontend Components
✅ **RegisterPage.tsx**
  - ✅ Conditional form fields based on role (tenant/manager/owner)
  - ✅ Property dropdown for tenant selection
  - ✅ Dynamic unit loading when property selected
  - ✅ Unit selection dropdown showing vacant units with type/floor/price
  - ✅ Form validation requiring unit selection for tenants
  - ✅ Automatic unit reservation on registration
  - ✅ Tenant verification notification creation

✅ **PropertyManager.tsx (Super Admin)**
  - ✅ Enhanced table with unit details column
  - ✅ Visual occupancy progress bar
  - ✅ Unit count breakdown (total/occupied/vacant)
  - ✅ Property statistics including occupancy rates

✅ **TenantVerificationPanel.tsx (Property Manager)**
  - ✅ Lists pending tenant verifications
  - ✅ Shows unit information for each tenant
  - ✅ Approve/reject functionality
  - ✅ Unit status updates on approval

✅ **ManagerApprovalPanel.tsx (Super Admin)**
  - ✅ Lists pending manager registrations
  - ✅ Shows properties manager wants to manage
  - ✅ Approve/reject with role activation
  - ✅ Notification creation for managers

### Key Features
✅ **One Tenant Per Unit** - Each tenant registers for a specific unit, not just a property
✅ **Unit Status Tracking** - Units are marked: vacant → reserved → occupied
✅ **Automatic Notifications** - Managers and admins get notified of registrations/approvals
✅ **Mock Data** - 5 properties, 9 unit types, 21 individual units ready for testing

---

## Pre-Implementation Checklist

Before testing, ensure:
- [ ] All migrations have been run on your database
- [ ] Mock data has been populated (Westside Apartments, Downtown Plaza, etc.)
- [ ] Supabase client is properly configured
- [ ] Authentication is working

## Testing Flow

### Test 1: Verify Units Are Available
1. Open browser console or check database directly
2. Query: `SELECT * FROM units_detailed WHERE property_id = 'property-id' AND status = 'vacant' LIMIT 5`
3. Should return at least 5 vacant units
4. Each unit should have: unit_number, unit_type, floor_number, price_monthly

### Test 2: Register as Tenant (Complete Flow)
```
Step 1: Navigation
  - Go to /register
  - Should see registration form

Step 2: Select Role
  - Click "Account Type" dropdown
  - Select "Tenant / Looking to Rent"
  - Form should show property and unit fields

Step 3: Select Property
  - Click "Select Property" dropdown
  - Should show list of active properties
  - Select "Westside Apartments" (or any with units)

Step 4: Select Unit
  - Wait for "Loading available units..." to complete
  - Click "Select Unit" dropdown
  - Should show list like:
    * Unit A1 - 1-Bedroom ($15000/mo)
    * Unit A2 - 1-Bedroom ($15000/mo)
    * Unit B1 - 2-Bedroom ($20000/mo)
  - Select any unit

Step 5: Fill Form
  - Enter full name
  - Enter phone number
  - Enter email
  - Enter password (min 6 chars)
  - Confirm password

Step 6: Submit
  - Click "Create Account"
  - Should see success message
  - Should be redirected to login after 2 seconds

Step 7: Verify Database Changes
  - Check profiles table:
    * New user should have unit_id set
    * New user should have property_id set
    * status should be "pending"
  - Check units_detailed table:
    * Selected unit status should be "reserved"
    * occupant_id should be the new user's ID
  - Check tenant_verifications table:
    * New verification record with unit_id, status = "pending"
  - Check notifications table:
    * Manager notification for property should exist
```

### Test 3: Property Manager Verification (Complete Flow)
```
Step 1: Login as Property Manager
  - Create a manager user with the property
  - OR use existing manager from mock data
  
Step 2: View Verification Panel
  - Navigate to property manager portal
  - Find "Tenant Verification" or "Pending Approvals" section
  
Step 3: View Pending Tenant
  - Should see: newly registered tenant
  - Should show unit info:
    * Unit Number
    * Unit Type
    * Floor Number
    * Monthly Price
    
Step 4: Approve Tenant
  - Click "Approve" button
  - Should see success notification
  
Step 5: Verify Database Changes
  - Check tenant_verifications:
    * status should be "verified" (or "approved")
  - Check units_detailed:
    * status should now be "occupied"
  - Check profiles (for tenant):
    * status should be "active"
    * tenant can now log in
```

### Test 4: Property Manager Approval (Complete Flow)
```
Step 1: Register as Property Manager
  - Go to /register
  - Select "Property Manager"
  - Select properties to manage
  - Enter credentials
  - Submit

Step 2: Verify Super Admin Sees It
  - Login as super admin
  - Navigate to manager approval panel
  - Should see pending manager registration

Step 3: Approve Manager
  - Click "Approve" button
  - Should see success notification

Step 4: Verify Manager Can Login
  - Logout from super admin
  - Login with manager credentials
  - Should successfully access manager portal
  - Manager status should be "active"
```

### Test 5: PropertyManager Component Display
```
Step 1: Navigate to Property Management
  - Login as super admin
  - Go to property manager section
  
Step 2: Verify Table Display
  - Should show columns: Property, Location, Type, Status, Unit Details, Occupancy, Rent, Manager, Actions
  - Unit Details should show:
    * Total: X units
    * Occupied count and Vacant count
  - Occupancy should show:
    * Visual progress bar
    * Percentage occupied
    
Step 3: Check Properties
  - Should see "Westside Apartments"
  - Should show unit information
  - If you registered tenants, occupancy should update
```

---

## Database Verification Queries

Run these in your Supabase SQL Editor to verify setup:

### Check Properties with Units
```sql
SELECT 
  p.id,
  p.name,
  COUNT(ud.id) as total_units,
  SUM(CASE WHEN ud.status = 'occupied' THEN 1 ELSE 0 END) as occupied_units,
  SUM(CASE WHEN ud.status = 'vacant' THEN 1 ELSE 0 END) as vacant_units
FROM properties p
LEFT JOIN units_detailed ud ON p.id = ud.property_id
GROUP BY p.id, p.name;
```

### Check Vacant Units Available for Registration
```sql
SELECT 
  p.name as property,
  ud.unit_number,
  ud.unit_type,
  ud.floor_number,
  ud.price_monthly,
  ud.status
FROM units_detailed ud
JOIN properties p ON ud.property_id = p.id
WHERE ud.status = 'vacant'
ORDER BY p.name, ud.unit_number;
```

### Check Pending Tenant Verifications
```sql
SELECT 
  tv.id,
  pr.full_name,
  pr.email,
  ud.unit_number,
  ud.unit_type,
  tv.status,
  tv.created_at
FROM tenant_verifications tv
JOIN profiles pr ON tv.tenant_id = pr.id
LEFT JOIN units_detailed ud ON tv.unit_id = ud.id
WHERE tv.status = 'pending'
ORDER BY tv.created_at DESC;
```

### Check Tenant Profiles with Unit Info
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.status,
  ud.unit_number,
  ud.unit_type,
  pr.name as property_name,
  ud.status as unit_status
FROM profiles p
LEFT JOIN units_detailed ud ON p.unit_id = ud.id
LEFT JOIN properties pr ON p.property_id = pr.id
WHERE p.role = 'tenant'
ORDER BY p.created_at DESC;
```

### Check Notifications
```sql
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  sr.full_name as sender,
  n.created_at
FROM notifications n
JOIN profiles sr ON n.sender_id = sr.id
ORDER BY n.created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: "No units available" dropdown when selecting property
**Check:**
1. Are migrations run? `SELECT * FROM units_detailed LIMIT 1;`
2. Do properties have vacant units? `SELECT * FROM units_detailed WHERE status = 'vacant';`
3. Is property_id correctly stored in units_detailed?

### Issue: Unit status not updating after approval
**Check:**
1. Are RLS policies allowing updates? Check policies on units_detailed table
2. Is the approval function actually being called?
3. Check error logs in browser console

### Issue: Notifications not appearing
**Check:**
1. Is notifications table populated? `SELECT * FROM notifications;`
2. Is property_manager_id set on the property?
3. Check notification creation in handleRegister function

### Issue: Tenant can't login after approval
**Check:**
1. Is profile status updated to 'active'?
2. Does Supabase auth have the user?
3. Are RLS policies allowing profile access?

---

## Performance Metrics to Monitor

After implementation, track:
- Unit fetch time (should be < 500ms)
- Registration completion time (should be < 2 seconds)
- Occupancy calculation accuracy
- Notification delivery timeliness

## Success Criteria

✅ All tests pass without errors
✅ Units display correctly in registration form
✅ One tenant maps to exactly one unit
✅ Unit status properly transitions: vacant → reserved → occupied
✅ Managers receive notifications for approvals
✅ All approval workflows complete successfully
✅ Property management dashboard shows accurate occupancy

---

**Last Updated:** January 31, 2026
**Version:** 1.0
