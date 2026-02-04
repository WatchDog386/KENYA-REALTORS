# System Architecture - Property Assignment

## User Journeys

### Property Manager Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    PROPERTY MANAGER                         │
└─────────────────────────────────────────────────────────────┘

1. REGISTRATION
   ├─ Fill registration form
   ├─ Create account
   └─ status = 'active' (auto-approved)

2. LOGIN
   ├─ Enter credentials
   ├─ No pending approval blocking ✅
   └─ Redirected to dashboard

3. MANAGER PORTAL
   ├─ Dashboard loads
   └─ Assignment Status Section:
      ├─ IF assigned properties:
      │  └─ Show "My Assigned Properties"
      │     ├─ Property Name
      │     ├─ Property Address
      │     └─ Active Status
      └─ IF no properties:
         └─ Show "Waiting for Assignment"
            └─ "Super admin will assign properties..."

4. MANAGE PROPERTIES
   ├─ Click property
   └─ Manage tenants, payments, maintenance
```

---

### Super Admin Property Assignment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
└─────────────────────────────────────────────────────────────┘

1. SUPER ADMIN DASHBOARD
   ├─ Click "Property Managers" button
   └─ Opens PropertyManagersOverview page

2. PROPERTY MANAGERS PAGE
   ├─ Search & Filter Managers
   ├─ View each manager:
   │  ├─ Name & Email
   │  ├─ Active Status
   │  ├─ Assigned Property Count
   │  └─ List of Assigned Properties
   └─ Statistics Cards:
      ├─ Total Managers
      ├─ Active Managers
      └─ Total Assigned Properties

3. ASSIGN PROPERTIES
   ├─ Click "Assign Properties" on manager
   ├─ Dialog opens
   ├─ Select properties (checkboxes)
   ├─ Click "Assign X Properties"
   └─ Assignment saved

4. RESULT
   ├─ Manager profile updated
   ├─ Manager dashboard refreshes
   ├─ Shows new assigned properties
   └─ Count updates in overview
```

---

## Data Flow Diagram

```
┌──────────────────┐
│   Auth.Users     │
│   (Register)     │
└────────┬─────────┘
         │
         ├─ Trigger: handle_new_user()
         │
         v
┌──────────────────────┐
│    Profiles Table    │
│  - id (PK)           │
│  - email             │
│  - role              │
│  - status = 'active' │ ← AUTO-APPROVED
│  - is_active = true  │
│  - first_name        │
│  - last_name         │
└──────────┬───────────┘
           │
           ├─ Manager can login now ✅
           │
           v
┌──────────────────────────────────┐
│  ManagerPortal Dashboard         │
│  - Check for assignments         │
│  - Query: property_manager_...   │
│  - _assignments                  │
└────────┬─────────────────────────┘
         │
         v
┌──────────────────────────────────┐
│   AssignmentStatus Component     │
│                                  │
│   IF assignments exist:          │
│   └─ "My Assigned Properties"    │
│                                  │
│   ELSE:                          │
│   └─ "Waiting for Assignment"    │
└──────────────────────────────────┘
```

---

## Table Structure

### Profiles Table
```
id (UUID)
email
first_name
last_name
phone
role: 'property_manager' | 'tenant' | 'super_admin'
status: 'active' | 'inactive' | 'pending'
is_active: boolean
created_at
updated_at
```

### property_manager_assignments
```
id (UUID)
property_manager_id (FK → profiles.id)
property_id (FK → properties.id)
assigned_at
```

### Properties
```
id (UUID)
name
address
...
```

---

## Component Hierarchy

```
SuperAdminDashboard
├─ Quick Actions
│  └─ "Property Managers" Button
│     └─ /portal/super-admin/managers
│
└─ PropertyManagersOverview
   ├─ Search Bar
   ├─ Manager Cards
   │  └─ PropertyManagerAssignment (assign button)
   └─ Statistics Cards


ManagerPortal
├─ Metrics Section
│  ├─ Managed Properties
   ├─ Active Tenants
   └─ Pending Rent
│
├─ ✨ NEW: AssignmentStatus Section
│  ├─ If Assigned:
│  │  └─ Shows property list
│  └─ If Waiting:
│     └─ Shows waiting message
│
└─ Recent Activity
```

---

## State Management

### AssignmentStatus Component State
```javascript
const [assignments, setAssignments] = useState<Assignment[]>([]);
const [loading, setLoading] = useState(true);

// On Mount:
useEffect(() => {
  loadAssignments();
  // Queries: property_manager_assignments
  //         WHERE property_manager_id = user.id
}, [user?.id]);
```

### PropertyManagersOverview State
```javascript
const [managers, setManagers] = useState<PropertyManager[]>([]);
const [searchQuery, setSearchQuery] = useState("");

// On Mount:
useEffect(() => {
  loadManagers();
  // For each manager:
  //   1. Fetch from profiles WHERE role='property_manager'
  //   2. Fetch assignments FROM property_manager_assignments
  //   3. Count and format results
}, []);
```

---

## API Calls

### AssignmentStatus.tsx
```typescript
// On Component Mount
const { data, error } = await supabase
  .from("property_manager_assignments")
  .select(`
    id,
    property_id,
    assigned_at,
    properties(id, name, address)
  `)
  .eq("property_manager_id", user?.id)
  .order("assigned_at", { ascending: false });
```

### PropertyManagersOverview.tsx
```typescript
// Fetch All Managers
const { data: managersData } = await supabase
  .from("profiles")
  .select("id, email, first_name, last_name, is_active, status")
  .eq("role", "property_manager")
  .order("first_name");

// For Each Manager - Fetch Assignments
const { data: assignments } = await supabase
  .from("property_manager_assignments")
  .select(`property_id, properties(id, name, address)`)
  .eq("property_manager_id", manager.id);
```

---

## User Scenarios

### Scenario 1: New Property Manager Signs Up
```
1. Manager registers
2. Profile created with status='active'
3. Can immediately login
4. Dashboard shows "Waiting for Assignment"
5. Super admin assigns properties
6. Dashboard updates to show properties
```

### Scenario 2: Super Admin Assigns Properties
```
1. Super admin goes to Property Managers
2. Sees all managers with assignment count
3. Clicks "Assign Properties" on a manager
4. Selects 2 properties
5. Saves assignment
6. Manager's count increases from 0 → 2
7. Manager's dashboard auto-updates
8. Shows "My Assigned Properties" with 2 properties
```

### Scenario 3: Reassigning Properties
```
1. Super admin clicks "Assign Properties" again
2. Current assignments show as selected
3. Can add/remove properties
4. Saves new assignment
5. System updates assignments
6. Manager's dashboard reflects changes
```

---

## Error Handling

### AssignmentStatus
```
Loading State
├─ Show spinner
├─ "Loading assignments..."
└─ Disable interactions

Error State
├─ Log error to console
├─ Catch exceptions
└─ Still show UI with empty state

Empty State
└─ Show "Waiting for Assignment" message
```

### PropertyManagersOverview
```
Loading State
├─ Show spinner per load operation
└─ "Loading managers..."

Error State
├─ Toast notification
├─ Continue with partial data
└─ Log to console

Empty State
└─ Show alert: "No managers found"
```

---

## Performance Considerations

### Caching
- Each component loads on mount
- Real-time updates on assignment
- No heavy caching (data changes frequently)

### Queries
- Assignment queries are indexed by property_manager_id
- Minimal joins (property_manager_assignments + properties)
- No N+1 queries (batch fetching assignments)

### Pagination
- Current: Show all managers
- Future: Could add pagination for 100+ managers

---

## Future Enhancements

1. **Bulk Assignment**
   - Assign properties to multiple managers at once

2. **History Tracking**
   - See when properties were assigned/reassigned
   - Who made the assignment

3. **Automated Notifications**
   - Email manager when properties assigned
   - Notify tenants about new manager

4. **Performance Monitoring**
   - Track manager performance
   - Show in overview

5. **Assignment Validation**
   - Prevent assigning same property twice
   - Check manager capacity

---

**Architecture Version**: 4.3.0  
**Last Updated**: February 4, 2026
