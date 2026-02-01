# Registration and Approval Workflow Documentation

## Overview

The system supports three user types with different registration and approval workflows:

1. **Tenants** - Register with property and house number, require manager verification
2. **Property Managers** - Register and require super admin approval  
3. **Property Owners** - For future implementation

## Detailed Workflows

### 1. Tenant Registration Workflow

**Flow:**
```
Tenant Signup → Select Property + House Number → Create Verification Request → 
Notification to Manager → Manager Approval → Tenant Access Portal
```

**Steps:**
1. Tenant visits registration page and selects "Tenant / Looking to Rent"
2. Fills in basic information (name, email, phone, password)
3. Selects property from dropdown
4. Enters house number/unit information
5. Submits registration form
6. System creates:
   - User auth account
   - Profile record with `role: 'tenant'` and `status: 'active'`
   - Tenant verification request in `tenant_verifications` table with `status: 'pending'`
   - Notification sent to property manager

**Manager Actions:**
- Property manager receives notification in manager portal
- Reviews tenant details in "Tenant Verification Requests" panel
- Either approves or rejects with notes
- On approval: `tenant_verifications.status` → `'verified'`
- Notification sent back to tenant

**Tenant Portal Access:**
- After approval, tenant can login
- Portal displays:
  - Property name they're renting from
  - Their house number/unit
  - Lease information
  - Payments
  - Maintenance requests

### 2. Property Manager Registration Workflow

**Flow:**
```
Manager Signup → Select Properties to Manage → Create Approval Request → 
Notification to Super Admin → Super Admin Approval → Manager Access Portal
```

**Steps:**
1. Manager visits registration page and selects "Property Manager"
2. Fills in basic information (name, email, phone, password)
3. Selects one or more properties they will manage (checkboxes)
4. Submits registration form
5. System creates:
   - User auth account
   - Profile record with `role: 'property_manager'` and `status: 'pending'`
   - Manager approval request in `manager_approvals` table with `status: 'pending'`
   - Notification sent to all super admins

**Super Admin Actions:**
- Super admin receives notification in super admin dashboard
- Reviews manager details in "Manager Approval Requests" panel
- Either approves or rejects with notes
- On approval: 
  - `manager_approvals.status` → `'approved'`
  - `profiles.status` for manager → `'active'`
- Notification sent back to manager

**Manager Portal Access:**
- After approval, manager can login
- Portal displays:
  - Dropdown menu of managed properties
  - Tenant verification requests for their properties
  - Tenant management panel
  - Property analytics
  - Maintenance requests

### 3. Property Owner Registration Workflow

**Coming Soon** - Will be similar to property manager but with different permissions

## Database Schema

### New Tables

#### `tenant_verifications`
Tracks tenant registration verification by property managers.

```sql
- id (UUID) - Primary key
- tenant_id (UUID) - References profiles.id
- property_id (UUID) - References properties.id
- house_number (VARCHAR) - Tenant's house/unit number
- unit_id (UUID) - References units_detailed.id (optional)
- status (VARCHAR) - 'pending', 'verified', 'rejected', 'processing'
- verified_by (UUID) - Manager who verified
- verified_at (TIMESTAMP) - When verified
- verification_notes (TEXT) - Optional notes
- rejection_reason (TEXT) - Reason if rejected
- created_at, updated_at (TIMESTAMP)
```

#### `manager_approvals`
Tracks property manager registration approval by super admin.

```sql
- id (UUID) - Primary key
- manager_id (UUID) - References profiles.id
- property_id (UUID) - Primary managed property (optional)
- managed_properties (TEXT[]) - Array of property names
- status (VARCHAR) - 'pending', 'approved', 'rejected', 'processing'
- approved_by (UUID) - Admin who approved
- approved_at (TIMESTAMP) - When approved
- approval_notes (TEXT) - Optional notes
- rejection_reason (TEXT) - Reason if rejected
- created_at, updated_at (TIMESTAMP)
```

#### `notifications`
System-wide notifications for users.

```sql
- id (UUID) - Primary key
- recipient_id (UUID) - User receiving notification
- sender_id (UUID) - User sending notification (optional)
- type (VARCHAR) - 'tenant_verification', 'manager_approval', 
                   'verification_approved', 'verification_rejected',
                   'approval_approved', 'approval_rejected'
- related_entity_type (VARCHAR) - 'tenant', 'manager', 'property'
- related_entity_id (UUID) - ID of related entity
- title (VARCHAR) - Notification title
- message (TEXT) - Notification message
- is_read (BOOLEAN) - Read status
- read_at (TIMESTAMP) - When marked as read
- created_at, updated_at (TIMESTAMP)
```

### Updated `profiles` Table

Added new columns for tenant-specific information:
- `house_number` (VARCHAR) - Tenant's house/unit number
- `property_id` (UUID) - Property tenant is registered for
- `unit_id` (UUID) - Specific unit if assigned

## UI Components

### Property Manager Portal
- **TenantVerificationPanel** - Shows pending tenant verifications with approve/reject actions

### Super Admin Dashboard  
- **ManagerApprovalPanel** - Shows pending manager approvals with approve/reject actions

### Notifications
- Notification bell icon shows unread count
- Clicking opens notification center
- Different notification types display with context

## API Functions

All functions are in `src/services/approvalService.ts`:

### Tenant Verification
- `getTenantVerificationsForManager(managerId)` - Get pending verifications
- `verifyTenant(verificationId, managerId, approved, notes)` - Approve/reject tenant

### Manager Approval
- `getManagerApprovalsForAdmin()` - Get pending approvals
- `approvePropertyManager(approvalId, adminId, approved, notes)` - Approve/reject manager

### Notifications
- `getUserNotifications(userId)` - Get all notifications
- `markNotificationAsRead(notificationId)` - Mark as read
- `getUnreadNotificationCount(userId)` - Get unread count

## Status Values

### Verification Status
- `pending` - Awaiting manager review
- `verified` - Approved by manager, can login
- `rejected` - Rejected by manager
- `processing` - Being reviewed

### Approval Status
- `pending` - Awaiting super admin review
- `approved` - Approved, manager profile activated
- `rejected` - Rejected
- `processing` - Being reviewed

### Profile Status (for managers)
- `pending` - Awaiting admin approval
- `active` - Approved and can login
- `inactive` - Disabled

## Notification Types

- `tenant_verification` - New tenant registered, sent to manager
- `manager_approval` - New manager registered, sent to super admin
- `verification_approved` - Tenant approved, sent to tenant
- `verification_rejected` - Tenant rejected, sent to tenant
- `approval_approved` - Manager approved, sent to manager
- `approval_rejected` - Manager rejected, sent to manager

## RLS Security

All new tables have Row-Level Security (RLS) enabled with policies:

- Tenants can view their own verification requests
- Managers can view verifications for their properties only
- Super admins can view all approvals and verifications
- Users can view and manage their own notifications

## Implementation Checklist

- [x] Database migration for new tables
- [x] Register page updated with conditional fields
- [x] Tenant verification flows
- [x] Manager approval flows
- [x] Notification system
- [x] Service functions
- [x] Property manager verification panel
- [x] Super admin approval panel
- [ ] Integrate panels into actual portals
- [ ] Notification bell/center UI
- [ ] Email notifications (optional)
- [ ] Testing workflows

## Testing

To test the complete workflow:

1. **Register as Tenant:**
   - Go to registration page
   - Select "Tenant"
   - Fill form with property and house number
   - Submit

2. **Verify as Manager:**
   - Login as property manager
   - Go to manager portal
   - Find tenant verification request
   - Approve or reject

3. **Check Tenant Portal:**
   - Logout and login as tenant
   - Should now have access to tenant portal
   - See property details and other info

4. **Register as Manager:**
   - Go to registration page
   - Select "Property Manager"
   - Select properties to manage
   - Submit

5. **Approve as Super Admin:**
   - Login as super admin
   - Go to super admin dashboard
   - Find manager approval request
   - Approve or reject

6. **Check Manager Portal:**
   - Logout and login as manager
   - Should now have access to manager portal
   - See tenant verifications and property management
