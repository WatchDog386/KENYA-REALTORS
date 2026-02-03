# Registration Flow Documentation

## Current Working Flow (TENANT)

### 1. **Frontend Registration** (RegisterPage.tsx)
```
User fills form:
- Email, password, full name, phone
- Role: "tenant" (selected)
- Property ID
- Unit ID (specific unit)
```

### 2. **Auth Signup** (Supabase Auth)
```typescript
await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      phone: formData.phone,
      role: "tenant",  // <-- CRITICAL: Role in metadata
      status: "active",  // <-- Status in metadata
    },
  },
});
```

### 3. **Database Trigger** (handle_new_user)
When auth.users entry is created, the trigger:
```sql
-- Automatically creates profile row
INSERT INTO profiles (
  id,              -- from auth.users.id
  email,           -- from auth.users.email
  first_name,      -- from raw_user_meta_data
  last_name,       -- from raw_user_meta_data
  phone,           -- from raw_user_meta_data
  role,            -- from raw_user_meta_data->>'role'
  status,          -- from raw_user_meta_data->>'status'
  is_active,       -- set to true if status='active'
  created_at,
  updated_at
)
```

### 4. **Profile Created in Database**
- status: "pending" (for tenants)
- role: "tenant"
- is_active: false (until approved)

### 5. **Additional Tenant Steps** (After profile created)
```
A. Mark unit as reserved
   - UPDATE units_detailed SET status='reserved', occupant_id=user_id
   
B. Create approval request for tenant verification
   - INSERT INTO approval_requests
   - Type: "tenant_verification"
   - Status: "pending"
   
C. Notify property manager
   - INSERT INTO notifications
   - Type: "tenant_verification"
   - Recipient: property_manager_id
```

### 6. **Admin Dashboard sees it**
- AdminDashboard.tsx fetches ALL profiles
- Shows in "Approvals" tab:
  - role = 'property_manager' AND status = 'pending'
- Super admin clicks "Approve" button
- Updates profiles: SET status='active', is_active=true

---

## PROBLEM: Property Manager Registration

Property managers should follow the SAME path but currently fail at Step 2-3.

### The Issue:
When signing up property manager:
```typescript
// Step 2: Auth signup sends metadata with role='property_manager'
options: {
  data: {
    role: "property_manager",  // <-- This is correct
    status: "pending",         // <-- This is correct
  },
}
```

BUT at Step 3, the trigger tries to INSERT with these constraints:
- RLS policies block the insert
- Profile table RLS needs service_role to succeed

**SOLUTION**: The new migration file already fixes this with:
```sql
CREATE POLICY "service_role_unrestricted_access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

---

## DESIRED FLOW FOR PROPERTY MANAGERS

### Step 1: Property Manager Signs Up (RegisterPage.tsx - WORKING)
```typescript
const { data, error: signupError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      phone: formData.phone,
      role: "property_manager",        // ✅
      status: "pending",               // ✅ 
    },
  },
});
```

### Step 2: Trigger Creates Profile (Database Trigger - FIXED BY MIGRATION)
```sql
-- Trigger automatically creates:
INSERT INTO profiles (
  id, email, first_name, last_name, phone, role, status, is_active
) VALUES (
  new_user_id, 
  email, 
  first_name, 
  last_name, 
  phone, 
  'property_manager',  -- Role preserved from auth metadata
  'pending',           -- Status: waiting for approval
  false                -- Not active until approved
)
```

### Step 3: Frontend Creates Approval Request (RegisterPage.tsx - EXISTING CODE)
```typescript
if (formData.role === "property_manager") {
  // Create approval request for manager registration
  const { error: approvalError } = await supabase
    .from("approval_requests")
    .insert({
      submitted_by: data.user.id,
      type: "manager_assignment",
      title: `Property Manager Registration: ${formData.fullName}`,
      description: `New property manager for: ${managedPropertyNames.join(", ")}`,
      status: "pending",
    });
  
  // Notify super admins
  const { data: superAdmins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "super_admin");
    
  for (const admin of superAdmins) {
    await supabase.from("notifications").insert({
      recipient_id: admin.id,
      sender_id: data.user.id,
      type: "manager_approval",
      title: "New Property Manager Registration",
    });
  }
}
```

### Step 4: Super Admin Approves (AdminDashboard.tsx - EXISTING CODE)
```typescript
const handleApproveUser = async (userId: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({ 
      status: 'active',
      is_active: true
    })
    .eq('id', userId);
    
  // Property manager can now login!
};
```

### Step 5: Property Manager Assigns Properties (ManagerPortal - NEEDS TO EXIST)
```
Property manager sees:
- Dashboard of their assigned properties
- List of tenants in each property
- Approval queue for new tenant applications

Creates:
- manager_assignments table entry
- Permissions for property management
```

### Step 6: Property Manager Reviews & Approves Tenants
```
From manager portal, they can:
1. View pending tenant applications (approval_requests with type='tenant_verification')
2. Click "Approve" to activate tenant
3. Tenant can then login
```

---

## Required Database Tables (Already Exist)

✅ `auth.users` - Supabase auth table
✅ `profiles` - User profiles with role/status
✅ `approval_requests` - Track pending approvals
✅ `approval_queue` - Alternative approval tracking
✅ `notifications` - Alert system
✅ `manager_assignments` - Link managers to properties
✅ `tenant_verifications` - Tenant approval tracking

---

## Required Code Updates

### Already Done:
- ✅ RegisterPage.tsx - Sends correct metadata for both tenant and property_manager
- ✅ AdminDashboard.tsx - Can approve property managers
- ✅ Database trigger - Fixed with new migration

### Still Needed:
- 🔲 **Property Manager Portal** (ManagerPortal.tsx) - View assigned properties & approve tenants
- 🔲 **Tenant Approval Component** - Property managers approve/reject tenant applications
- 🔲 **Manager Assignment Logic** - Super admin assigns properties to approved managers
- 🔲 **Tenant Application List** - Shows pending tenant verifications for each manager

---

## Database Query Reference

### Super Admin sees pending property managers:
```sql
SELECT * FROM profiles 
WHERE role = 'property_manager' AND status = 'pending'
ORDER BY created_at DESC;
```

### Property Manager sees pending tenants:
```sql
SELECT tv.*, p.unit_number, prop.name as property_name
FROM tenant_verifications tv
JOIN units_detailed p ON tv.unit_id = p.id
JOIN properties prop ON tv.property_id = prop.id
WHERE prop.property_manager_id = auth.uid()
  AND tv.status = 'pending'
ORDER BY tv.created_at DESC;
```

### Approve tenant (property manager does):
```sql
UPDATE tenant_verifications 
SET status = 'verified', verified_by = auth.uid(), verified_at = NOW()
WHERE id = tenant_verification_id;

-- Also update profiles table:
UPDATE profiles 
SET status = 'active', is_active = true 
WHERE id = tenant_user_id;
```

---

## Testing Checklist

- [ ] 1. Sign up as Tenant → See in Admin Dashboard
- [ ] 2. Super Admin approves Tenant → Tenant can login
- [ ] 3. Sign up as Property Manager → See in Admin Dashboard pending approvals
- [ ] 4. Super Admin approves Property Manager → Manager can login
- [ ] 5. Super Admin assigns properties to Manager
- [ ] 6. Manager logs in → Sees their properties
- [ ] 7. New Tenant signs up → Appears in Manager's pending approvals
- [ ] 8. Manager approves Tenant → Tenant can login

