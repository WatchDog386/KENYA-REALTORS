# Quick Reference Guide - Property Assignment System

## 🚀 5-Minute Setup

### 1. Database
```sql
Run: database/20260213_initialize_technician_categories.sql
```

### 2. Routes (add to your router)
```tsx
{ path: '/portal/technician/dashboard', element: <TechnicianDashboard />, meta: { role: 'technician' } }
{ path: '/portal/proprietor/dashboard', element: <ProprietorDashboard />, meta: { role: 'proprietor' } }
{ path: '/portal/super-admin/assignments', element: <PropertyAssignmentAdmin />, meta: { role: 'super_admin' } }
```

### 3. Navigation
```tsx
<Link to="/portal/technician/dashboard">My Assignments</Link>
<Link to="/portal/proprietor/dashboard">My Properties</Link>
<Link to="/portal/super-admin/assignments">Staff Assignments</Link>
```

**Done!** System is live.

---

## 📍 URLs Cheat Sheet

| Role | URL | Page |
|------|-----|------|
| Proprietor | `/portal/proprietor/dashboard` | View owned properties |
| Technician | `/portal/technician/dashboard` | View assignments |
| Super Admin | `/portal/super-admin/assignments` | Manage all |
| Anyone | `/portal/properties-management` | Assign staff |

---

## 🎯 Common Tasks

### Assign Proprietor
```
Property Card → "Assign Proprietor" → Select Proprietor → Enter % → Save
```

### Assign Technician
```
Property Card → "Assign Technician" → Select Category → Select Tech → Save
```

### Assign Caretaker
```
Property Card → "Assign Caretaker" → Select Caretaker → Save
```

### View All Assignments
```
Go to /portal/super-admin/assignments → Use tabs
```

### Remove Assignment
```
Admin Panel → Tab → Find assignment → Click trash icon
```

---

## 💻 Service Methods Quick Ref

```typescript
import { PropertyAssignmentService } from '@/services/propertyAssignmentService';

// Proprietors
assignProprietor(propId, propId, %)
removeProprietorAssignment(id)
getPropertyProprietors(propertyId)
getProprietorProperties(proprietorId)

// Technicians
assignTechnician(techId, propertyId)
removeTechnicianAssignment(id)
getPropertyTechnicians(propertyId)
getTechnicianProperties(technicianId)

// Caretakers
assignCaretaker(careId, propertyId)
removeCaretaker(propertyId)
getPropertyCaretaker(propertyId)

// Utilities
getPropertyAssignmentsSummary(propertyId) // Get all 3 types
getUserAssignments(userId, role) // Get user's assignments
```

---

## 📦 Technician Categories

1. Plumbing
2. Electrical
3. HVAC
4. Carpentry
5. Tile Fixing
6. Painting
7. Lift Maintenance
8. Roofing
9. Pest Control
10. Masonry
11. Landscaping
12. General Maintenance

---

## 💾 Data Structure

### Proprietor Assignment
```typescript
{
  id: string,
  proprietor_id: string,
  property_id: string,
  ownership_percentage: 100,
  assigned_at: timestamp,
  is_active: true
}
```

### Technician Assignment
```typescript
{
  id: string,
  technician_id: string,
  property_id: string,
  assigned_at: timestamp,
  is_active: true,
  technician: {
    category: { name: 'Plumbing' },
    profile: { first_name, last_name, email }
  }
}
```

### Caretaker Assignment
```typescript
{
  id: string,
  user_id: string, // Caretaker user
  property_id: string, // UNIQUE - one per property
  assignment_date: timestamp,
  status: 'active' | 'inactive'
}
```

---

## 🔑 User Roles

Create users with these roles (auto-creates assignment records):

```
role: 'proprietor'  → Creates proprietors record
role: 'technician'  → Creates technicians record
role: 'caretaker'   → Creates caretakers record
```

---

## 📊 Dashboard Info

### Proprietor Dashboard Shows:
- Business name / owner name
- All owned properties
- Ownership percentages
- Monthly income per property
- Total units and occupancy
- Contact info

### Technician Dashboard Shows:
- Your name and specialization
- Email and phone
- Average rating
- Jobs completed
- List of assigned properties
- Property status and details

### Admin Dashboard Shows:
- Total counts (statistics cards)
- Search box to filter
- Three tabs: Proprietors | Technicians | Caretakers
- Delete buttons for each assignment

---

## ✅ Component Imports

```tsx
import { 
  ProprietorAssignmentDialog,
  TechnicianAssignmentDialog,
  CaretakerAssignmentDialog,
  PropertyAssignmentView
} from '@/components/PropertyAssignments';

// Use in components:
<ProprietorAssignmentDialog propertyId={id} onAssignmentChanged={callback} />
<TechnicianAssignmentDialog propertyId={id} onAssignmentChanged={callback} />
<CaretakerAssignmentDialog propertyId={id} onAssignmentChanged={callback} />
<PropertyAssignmentView propertyId={id} />
```

---

## 🔐 Security Rules

| User Type | Can See | Can Edit |
|-----------|---------|----------|
| Proprietor | Own properties only | None |
| Technician | Assigned properties only | None |
| Caretaker | Assigned property only | Property info |
| Super Admin | Everything | Everything |

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Categories missing | Run migration: `20260213_initialize_technician_categories.sql` |
| Caretaker stays assigned | Clear cache, refresh page |
| Can't see assignment | Check user role, check RLS policies |
| Permission denied | Ensure super_admin role for admin pages |
| Service not found | Check import path: `@/services/propertyAssignmentService` |

---

## 📂 File Locations

```
Components:     src/components/PropertyAssignments/
Pages:          src/pages/portal/{technician,proprietor,super-admin}/
Service:        src/services/propertyAssignmentService.ts
Migration:      database/20260213_initialize_technician_categories.sql
Docs:           docs/PROPERTY_ASSIGNMENT_*.md
```

---

## 🧪 Quick Test Steps

1. Create proprietor user → Assign to property → Verify dashboard
2. Create technician user → Assign category → Assign to property → Verify dashboard
3. Create caretaker user → Assign to property → Verify can see it
4. Go to /portal/super-admin/assignments → Verify all appear
5. Search for names → Verify filter works
6. Delete assignments → Verify they're gone

---

## 💡 Pro Tips

1. **Bulk Assignments**: Use admin dashboard for overview before individual dialogs
2. **Ownership Split**: Use percentages for co-ownership tracking
3. **Categories**: Assign technician to property multiple times (different categories)
4. **Caretaker**: Auto-removes from old property when reassigned
5. **Search**: Works in admin dashboard, case-insensitive
6. **Stats**: Admin dashboard has statistics cards at top

---

## 📞 Documentation Files

1. `IMPLEMENTATION_SUMMARY.md` ← **START HERE**
2. `PROPERTY_ASSIGNMENT_README.md` - Features overview
3. `PROPERTY_ASSIGNMENT_SYSTEM.md` - Technical details
4. `PROPERTY_ASSIGNMENT_INTEGRATION.md` - Setup steps

---

## Version Info

- **Status**: ✅ Production Ready
- **Version**: 1.0.0
- **Last Updated**: Feb 13, 2026
- **Files Created**: 11
- **Components**: 4
- **Pages**: 4
- **Services**: 1
- **Docs**: 4

---

**Questions?** Check the detailed documentation files listed above.

**Ready to go?** Follow the 5-minute setup at the top and start using the system!

✅ **Everything is complete and tested!**
