# Property Assignment System - Integration Guide

## Quick Setup Instructions

### 1. Database Setup

Run these SQL migrations in order:

```bash
# Run in Supabase SQL Editor or via migration tool
1. database/20260211_add_technician_proprietor_caretaker_roles.sql
2. database/20260213_initialize_technician_categories.sql
```

### 2. Component Integration

The property management components are already integrated into `PropertiesManagement.tsx`:

```tsx
// Already included at the top of PropertiesManagement
import { 
  ProprietorAssignmentDialog, 
  TechnicianAssignmentDialog, 
  CaretakerAssignmentDialog 
} from '@/components/PropertyAssignments';

// Already integrated in property cards
<div className="pt-4 border-t border-gray-200 space-y-2">
  <label className="text-xs font-semibold text-gray-600 uppercase">Assign Staff</label>
  <div className="grid grid-cols-2 gap-2">
    <ProprietorAssignmentDialog propertyId={property.id} onAssignmentChanged={() => loadProperties()} />
    <TechnicianAssignmentDialog propertyId={property.id} onAssignmentChanged={() => loadProperties()} />
  </div>
  <CaretakerAssignmentDialog propertyId={property.id} onAssignmentChanged={() => loadProperties()} />
</div>
```

✅ **Status**: Already done!

### 3. Add Routes for New Pages

Add these routes to your router (typically in `src/pages/portal/routes.tsx` or your main routing file):

```tsx
// Technician Dashboard
{
  path: '/portal/technician/dashboard',
  element: <TechnicianDashboard />,
  meta: { 
    requiresAuth: true, 
    requiredRoles: ['technician'] 
  }
}

// Proprietor Dashboard
{
  path: '/portal/proprietor/dashboard',
  element: <ProprietorDashboard />,
  meta: { 
    requiresAuth: true, 
    requiredRoles: ['proprietor'] 
  }
}

// Property Assignment Admin
{
  path: '/portal/super-admin/assignments',
  element: <PropertyAssignmentAdmin />,
  meta: { 
    requiresAuth: true, 
    requiredRoles: ['super_admin'] 
  }
}
```

### 4. Add Navigation Links

Add these to your main navigation/menu (adjust based on your nav structure):

```tsx
// For Technicians
<Link to="/portal/technician/dashboard">
  <Wrench className="w-4 h-4 mr-2" />
  My Assignments
</Link>

// For Proprietors
<Link to="/portal/proprietor/dashboard">
  <Building className="w-4 h-4 mr-2" />
  My Properties
</Link>

// For Super Admin
<Link to="/portal/super-admin/assignments">
  <Users className="w-4 h-4 mr-2" />
  Staff Assignments
</Link>
```

### 5. Import Services (Optional)

If you need to use the assignment service in other pages:

```tsx
import { PropertyAssignmentService } from '@/services/propertyAssignmentService';

// Example usage:
const proprietors = await PropertyAssignmentService.getPropertyProprietors(propertyId);
const technicians = await PropertyAssignmentService.getPropertyTechnicians(propertyId);
const caretaker = await PropertyAssignmentService.getPropertyCaretaker(propertyId);
```

## File Structure

```
src/
├── components/
│   └── PropertyAssignments/
│       ├── index.ts                          ✅ Exports all components
│       ├── ProprietorAssignmentDialog.tsx    ✅ Assign proprietors
│       ├── TechnicianAssignmentDialog.tsx    ✅ Assign technicians
│       ├── CaretakerAssignmentDialog.tsx     ✅ Assign caretakers
│       └── PropertyAssignmentView.tsx        ✅ View assignments
│
├── pages/
│   └── portal/
│       ├── PropertiesManagement.tsx          ✅ Updated with dialogs
│       ├── technician/
│       │   └── TechnicianDashboard.tsx       ✅ New technician page
│       ├── proprietor/
│       │   └── ProprietorDashboard.tsx       ✅ New proprietor page
│       └── super-admin/
│           └── PropertyAssignmentAdmin.tsx   ✅ New admin page
│
├── services/
│   └── propertyAssignmentService.ts          ✅ Assignment service
│
└── database/
    └── 20260213_initialize_technician_categories.sql ✅ Category seed data
```

## User Workflows

### 1. Creating a Technician

1. Super Admin: Create user with role `technician`
   - System auto-creates technician record
2. Super Admin: Assign category to technician
   - Go to technician's profile or admin panel
   - Assign a category (Plumbing, Electrical, etc.)
3. Super Admin: Assign to property
   - Go to property management
   - Click "Assign Technician"
   - Select category → Select technician → Save
4. Technician: View dashboard
   - Login with technician account
   - Go to `/portal/technician/dashboard`
   - See assigned properties and specialization

### 2. Creating a Proprietor

1. Super Admin: Create user with role `proprietor`
   - System auto-creates proprietor record
2. Super Admin: Assign properties
   - Go to property management
   - Click "Assign Proprietor"
   - Select proprietor → Set ownership % → Save
3. Proprietor: View dashboard
   - Login with proprietor account
   - Go to `/portal/proprietor/dashboard`
   - See all owned/co-owned properties and income

### 3. Creating a Caretaker

1. Super Admin: Create user with role `caretaker`
   - System auto-creates caretaker record
2. Super Admin: Assign to property
   - Go to property management
   - Click "Assign Caretaker"
   - Select caretaker → Save
3. Caretaker: Access assignment
   - Login with caretaker account
   - Auto-directed to assigned property
   - Can manage maintenance, communicate with manager

## API Endpoints / Service Methods

All operations are done through `PropertyAssignmentService`:

```typescript
// Proprietor operations
PropertyAssignmentService.assignProprietor(proprietorId, propertyId, percentage)
PropertyAssignmentService.removeProprietorAssignment(assignmentId)
PropertyAssignmentService.getPropertyProprietors(propertyId)
PropertyAssignmentService.getProprietorProperties(proprietorId)

// Technician operations
PropertyAssignmentService.assignTechnician(technicianId, propertyId)
PropertyAssignmentService.removeTechnicianAssignment(assignmentId)
PropertyAssignmentService.getPropertyTechnicians(propertyId)
PropertyAssignmentService.getTechnicianProperties(technicianId)
PropertyAssignmentService.getTechnicianCategories()
PropertyAssignmentService.getTechniciansByCategory(categoryId)

// Caretaker operations
PropertyAssignmentService.assignCaretaker(caretakerId, propertyId)
PropertyAssignmentService.removeCaretaker(propertyId)
PropertyAssignmentService.getPropertyCaretaker(propertyId)
PropertyAssignmentService.getCaretakerProperty(caretakerId)

// Utilities
PropertyAssignmentService.getPropertyAssignmentsSummary(propertyId)
PropertyAssignmentService.getUserAssignments(userId, role)
```

## Key Features Implemented

✅ **Proprietor Management**
- Multiple properties per proprietor
- Ownership percentage tracking
- Proprietor dashboard with income calculations
- Co-ownership support

✅ **Technician Management**
- Category-based assignment (12 categories)
- Technician dashboard with specialization display
- Multiple technicians per property (different categories)
- Performance metrics

✅ **Caretaker Management**
- One caretaker per property
- Exclusive assignment with auto-removal from previous property
- Full responsibility tracking

✅ **Admin Controls**
- Property management page with assignment dialogs
- Centralized admin dashboard for all assignments
- Search and filter capabilities
- Bulk removal of assignments

✅ **Database & Security**
- Row-level security (RLS) for all tables
- Proper foreign keys and constraints
- Unique constraints on appropriate fields
- Audit trail with assigned_by and timestamps

## Testing Checklist

- [ ] Create test proprietor account and assign to property
- [ ] Create test technician account with category and assign to property
- [ ] Create test caretaker account and assign to property
- [ ] View property management page - dialogs appear
- [ ] Assign staff from property cards - works correctly
- [ ] Access technician dashboard - shows correct info
- [ ] Access proprietor dashboard - shows correct properties and income
- [ ] Access admin dashboard - shows all assignments
- [ ] Remove assignments - works correctly
- [ ] Search in admin dashboard - filters correctly

## Troubleshooting

### Problem: "No categories found" when assigning technician
**Solution**: Run migration `20260213_initialize_technician_categories.sql` to seed categories

### Problem: Can't assign proprietor - "Not authenticated"
**Solution**: Ensure super admin is logged in and making the request

### Problem: Caretaker assigned to old property
**Solution**: System should auto-remove from previous property. Check if update query is working

### Problem: Technician category not showing in dashboard
**Solution**: Ensure technician has category assigned. Check technician `category_id` in database

## Performance Optimization

For large datasets, consider:

1. Adding indexes on frequently filtered columns:
```sql
CREATE INDEX idx_proprietor_properties_property_id ON proprietor_properties(property_id);
CREATE INDEX idx_technician_assignments_property_id ON technician_property_assignments(property_id);
CREATE INDEX idx_caretakers_property_id ON caretakers(property_id);
```

2. Implement pagination in admin dashboard for large lists

3. Cache technician categories (they change infrequently)

## Future Enhancements

- [ ] Bulk CSV import for assignments
- [ ] Assignment templates for property types
- [ ] Automated payment processing for proprietors
- [ ] Service request workflow integration
- [ ] Performance rating system
- [ ] Multi-language category names
- [ ] Audit logs for all changes
