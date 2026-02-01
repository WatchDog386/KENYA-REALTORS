# Code Changes Reference

## RegisterPage.tsx - Form State Structure

The form now tracks role-specific data:

```typescript
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "tenant",
  // Tenant specific fields
  houseNumber: "",
  propertyId: "",
  // Property manager specific fields
  managedPropertyIds: [] as string[],
});
```

## Registration Handler Logic

The `handleRegister` function now:

1. **For Tenants:**
   - Creates profile with `house_number` and `property_id`
   - Creates tenant verification request (status: pending)
   - Sends notification to property manager
   - Shows "waiting for verification" message

2. **For Property Managers:**
   - Creates profile with status: pending
   - Creates manager approval request
   - Sends notification to all super admins
   - Shows "waiting for approval" message

3. **For Owners:**
   - Standard registration (approval pending)

## Profile Table Changes

New columns added to `profiles`:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS house_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL;
```

## API Service Functions

### Tenant Verification
```typescript
// Get pending verifications for a manager
const verifications = await getTenantVerificationsForManager(managerId);

// Approve or reject a tenant
await verifyTenant(verificationId, managerId, true, "notes");
```

### Manager Approval
```typescript
// Get pending manager approvals for super admin
const approvals = await getManagerApprovalsForAdmin();

// Approve or reject a manager
await approvePropertyManager(approvalId, adminId, true, "notes");
```

### Notifications
```typescript
// Get user's notifications
const notifications = await getUserNotifications(userId);

// Mark as read
await markNotificationAsRead(notificationId);

// Get unread count
const count = await getUnreadNotificationCount(userId);
```

## Component Usage

### In Property Manager Portal
```tsx
import { TenantVerificationPanel } from "@/components/portal/property-manager/TenantVerificationPanel";

// In your manager dashboard:
<TenantVerificationPanel />
```

### In Super Admin Dashboard
```tsx
import { ManagerApprovalPanel } from "@/components/portal/super-admin/ManagerApprovalPanel";

// In your super admin dashboard:
<ManagerApprovalPanel />
```

## Status Workflow Examples

### Tenant Workflow
```
profiles.status: 'active'     <- Tenant can login immediately
profiles.role: 'tenant'       <- Assigned role

tenant_verifications.status:
  'pending'        <- Just registered
  → 'verified'     <- Manager approved (tenant can access portal)
  → 'rejected'     <- Manager rejected
```

### Property Manager Workflow
```
profiles.status: 'pending'      <- Just registered (cannot login)
profiles.role: 'property_manager'

manager_approvals.status:
  'pending'        <- Just registered
  → 'approved'     <- Super admin approved
      profiles.status → 'active' (now can login)
  → 'rejected'     <- Super admin rejected
```

## Conditional UI Examples

### Show Fields Only for Tenants
```tsx
{formData.role === "tenant" && (
  <div className="...">
    {/* Tenant-specific form fields */}
  </div>
)}
```

### Show Fields Only for Managers
```tsx
{formData.role === "property_manager" && (
  <div className="...">
    {/* Manager-specific form fields */}
  </div>
)}
```

## Validation Examples

```typescript
// Tenant validation
if (formData.role === "tenant") {
  if (!formData.propertyId.trim()) {
    newErrors.propertyId = "Property is required for tenants";
  }
  if (!formData.houseNumber.trim()) {
    newErrors.houseNumber = "House number/unit is required for tenants";
  }
}

// Manager validation
if (formData.role === "property_manager") {
  if (formData.managedPropertyIds.length === 0) {
    newErrors.managedPropertyIds = "Select at least one property to manage";
  }
}
```

## Notification Creation Examples

### Sending Tenant Verification Notification to Manager
```typescript
await supabase
  .from("notifications")
  .insert({
    recipient_id: manager.property_manager_id,
    sender_id: tenant_user_id,
    type: "tenant_verification",
    related_entity_type: "tenant",
    related_entity_id: tenant_user_id,
    title: "New Tenant Registration",
    message: `${fullName} has registered as a tenant for house ${houseNumber}...`,
  });
```

### Sending Manager Approval Notification to Super Admin
```typescript
await supabase
  .from("notifications")
  .insert({
    recipient_id: admin_id,
    sender_id: manager_user_id,
    type: "manager_approval",
    related_entity_type: "manager",
    related_entity_id: manager_user_id,
    title: "New Property Manager Registration",
    message: `${fullName} has registered as a property manager...`,
  });
```

## Query Examples

### Get Tenant Verifications for Manager
```sql
SELECT * FROM tenant_verifications
WHERE status = 'pending'
AND property_id IN (
  SELECT id FROM properties
  WHERE property_manager_id = auth.uid()
);
```

### Get Manager Approvals for Super Admin
```sql
SELECT * FROM manager_approvals
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### Get Unread Notifications
```sql
SELECT COUNT(*) FROM notifications
WHERE recipient_id = auth.uid()
AND is_read = false;
```

## Error Handling

All service functions include try-catch blocks:
```typescript
try {
  // Database operation
} catch (error) {
  console.error("Error message:", error);
  throw error; // Re-throw for component handling
}
```

Component error handling:
```typescript
try {
  setProcessingId(verificationId);
  await verifyTenant(verificationId, userId, true);
  toast.success("Tenant verified successfully");
  // Update UI
} catch (error) {
  toast.error("Failed to verify tenant");
} finally {
  setProcessingId(null);
}
```

## Loading States

Components include loading indicators:
```tsx
{loading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
)}
```

And processing states for buttons:
```tsx
<button
  disabled={processingId === verification.id}
  className="...disabled:opacity-50 disabled:cursor-not-allowed"
>
  {processingId === verification.id ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Check className="w-4 h-4" />
  )}
  Approve
</button>
```

## Toast Notifications

Success messages:
```typescript
toast.success("Tenant verified successfully");
```

Error messages:
```typescript
toast.error("Failed to approve tenant");
```

These appear as temporary notifications in the UI.
