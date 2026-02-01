# Quick Integration Guide

## Step 1: Run Database Migration

Execute the SQL migration file in Supabase SQL Editor:

```bash
# File: supabase/migrations/20260131_add_tenant_manager_fields.sql
# Copy entire contents and run in Supabase console
```

This will:
- Add columns to profiles table
- Create tenant_verifications table
- Create manager_approvals table
- Create notifications table
- Set up all RLS policies

## Step 2: Test Registration

1. **Register as Tenant:**
   - Navigate to `/register` page
   - Select "Tenant / Looking to Rent"
   - Fill form with property selection and house number
   - Submit form
   - Check: Should show "waiting for verification" message

2. **Register as Manager:**
   - Navigate to `/register` page
   - Select "Property Manager"
   - Select properties to manage
   - Submit form
   - Check: Should show "waiting for approval" message

## Step 3: Add Components to Portals

### For Property Manager Portal

In your property manager dashboard component:

```tsx
import { TenantVerificationPanel } from "@/components/portal/property-manager/TenantVerificationPanel";

export const PropertyManagerDashboard = () => {
  return (
    <div className="dashboard">
      <h1>Manager Dashboard</h1>
      
      {/* Add this component */}
      <TenantVerificationPanel />
      
      {/* Other dashboard content */}
    </div>
  );
};
```

### For Super Admin Dashboard

In your super admin dashboard component:

```tsx
import { ManagerApprovalPanel } from "@/components/portal/super-admin/ManagerApprovalPanel";

export const SuperAdminDashboard = () => {
  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Add this component */}
      <ManagerApprovalPanel />
      
      {/* Other dashboard content */}
    </div>
  );
};
```

## Step 4: Create Notification Center (Optional but Recommended)

Create a notification component:

```tsx
// src/components/NotificationCenter.tsx
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, getUnreadNotificationCount } from "@/services/approvalService";

export const NotificationCenter = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    const notifs = await getUserNotifications(userId);
    setNotifications(notifs);
    
    const count = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  };

  const handleMarkAsRead = async (notifId: string) => {
    await markNotificationAsRead(notifId);
    loadNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-slate-600">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-2 mb-2 border-l-4 rounded ${
                  notif.is_read
                    ? "border-slate-300 bg-slate-50"
                    : "border-blue-600 bg-blue-50"
                }`}
              >
                <p className="font-bold text-sm">{notif.title}</p>
                <p className="text-xs text-slate-600">{notif.message}</p>
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-xs text-blue-600 mt-1"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
```

Add to your app header:
```tsx
<NotificationCenter userId={user?.id} />
```

## Step 5: Update Tenant Portal

Show tenant property information:

```tsx
export const TenantPortal = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    // Get profile with property info
    const { data: prof } = await supabase
      .from("profiles")
      .select("*, properties(*)")
      .eq("id", user.id)
      .single();

    setProfile(prof);
    if (prof.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("*")
        .eq("id", prof.property_id)
        .single();
      setProperty(prop);
    }
  };

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      
      {property && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2>Your Property</h2>
          <p className="font-bold">{property.name}</p>
          <p className="text-sm text-slate-600">{property.address}</p>
          <p className="mt-2">
            <strong>Your Unit:</strong> {profile.house_number}
          </p>
        </div>
      )}

      {/* Other tenant portal content */}
    </div>
  );
};
```

## Step 6: Update Manager Portal

Show managed properties with dropdown:

```tsx
export const PropertyManagerPortal = ({ user }) => {
  const [managedProperties, setManagedProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadProperties();
  }, [user?.id]);

  const loadProperties = async () => {
    // Get properties where user is manager
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("property_manager_id", user.id);

    setManagedProperties(data || []);
  };

  return (
    <div>
      <h1>Property Manager Dashboard</h1>

      {/* Property Dropdown */}
      <select
        value={selectedProperty?.id || ""}
        onChange={(e) => {
          const prop = managedProperties.find(p => p.id === e.target.value);
          setSelectedProperty(prop);
        }}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="">Select a property to manage</option>
        {managedProperties.map((prop) => (
          <option key={prop.id} value={prop.id}>
            {prop.name}
          </option>
        ))}
      </select>

      {selectedProperty && (
        <div className="mt-6">
          <h2>{selectedProperty.name}</h2>
          
          {/* Add TenantVerificationPanel here */}
          <TenantVerificationPanel />
          
          {/* Other property management content */}
        </div>
      )}
    </div>
  );
};
```

## Step 7: Verify All Works

Checklist to verify complete integration:

- [ ] Migration executed successfully
- [ ] Can register as tenant with property selection
- [ ] Can register as property manager with properties
- [ ] Tenant verification panel appears in manager dashboard
- [ ] Manager approval panel appears in admin dashboard
- [ ] Notifications appear in notification center
- [ ] Tenant portal shows property and house number
- [ ] Manager portal shows properties dropdown
- [ ] Manager can approve/reject tenants
- [ ] Admin can approve/reject managers
- [ ] Status updates are correct
- [ ] Notifications are sent to correct users

## Troubleshooting

### Tenant verification panel not showing
- Check: Manager dashboard has the component imported
- Check: Property manager is logged in
- Check: Database migration was executed

### Notifications not appearing
- Check: Notifications table exists
- Check: RLS policies are enabled
- Check: Notification bell component is added to header
- Check: User ID is being passed correctly

### Role not updating on manager approval
- Check: Super admin role is confirmed in profiles
- Check: approvePropertyManager function is called with correct adminId
- Check: Manager profile status changes to 'active'

### Properties not loading in dropdown
- Check: Properties table has active properties
- Check: Current user can access properties
- Check: Property query doesn't have RLS issues

## Performance Tips

1. **Add indexes** for frequently queried columns:
```sql
CREATE INDEX IF NOT EXISTS idx_manager_approvals_status ON manager_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tenant_verifications_property ON tenant_verifications(property_id);
```

2. **Cache notifications** to reduce queries
3. **Use pagination** for notification lists
4. **Debounce** notification refresh calls

## Security Notes

- All new tables have RLS enabled
- Tenants can only see their own verifications
- Managers can only see verifications for their properties
- Admins can see all approvals
- Never expose role changes to client-side only
- Always validate on backend before approving
