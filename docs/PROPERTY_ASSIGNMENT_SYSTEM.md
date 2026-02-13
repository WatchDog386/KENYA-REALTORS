# Property Management & Assignment System

## Overview

This system allows super-admins to assign proprietors, technicians, and caretakers to properties with specialized roles and categories.

## Architecture

### Database Tables

#### Core Tables
- **proprietor_properties**: Tracks ownership of properties by proprietors (multiple proprietors can own one property)
- **technician_property_assignments**: Assigns technicians to properties by their specialization
- **caretakers**: Assigns one caretaker per property (exclusive assignment)
- **technician_categories**: Defines technician specializations (plumbing, electrical, tile fixing, etc.)

### Key Features

#### 1. Proprietor Management
- **Multiple Properties**: A proprietor can own or co-own multiple properties
- **Ownership Percentage**: Track ownership stakes (e.g., 50% ownership)
- **Proprietor Dashboard**: View all owned properties and income
- **Business Profile**: Track business name, registration, bank details

#### 2. Technician Management
- **Category-Based Assignment**: Technicians assigned with specialization category
- **Single Property per Category**: One technician per property per category
- **Dashboard**: Technicians see assigned properties and their category
- **Categories Available**:
  - Plumbing
  - Electrical
  - HVAC
  - Carpentry
  - Tile Fixing
  - Painting
  - Lift Maintenance
  - Roofing
  - Pest Control
  - Masonry
  - Landscaping
  - General Maintenance

#### 3. Caretaker Management
- **Exclusive Assignment**: Only one caretaker per property
- **Full Responsibility**: Single point of contact for day-to-day property management
- **Dashboard**: View assigned property details
- **Hire Date Tracking**: Track employment history

## Components

### PropertyAssignments Components

Located in `src/components/PropertyAssignments/`

#### ProprietorAssignmentDialog
```tsx
<ProprietorAssignmentDialog 
  propertyId={property.id}
  onAssignmentChanged={() => loadProperties()}
/>
```
- Dialog to assign proprietors to properties
- Supports multiple proprietors per property
- Set ownership percentage
- Remove assignments

#### TechnicianAssignmentDialog
```tsx
<TechnicianAssignmentDialog 
  propertyId={property.id}
  onAssignmentChanged={() => loadProperties()}
/>
```
- Dialog to assign technicians by category
- First select category, then technician
- Multiple technicians possible (different categories)
- Shows technician's specialization

#### CaretakerAssignmentDialog
```tsx
<CaretakerAssignmentDialog 
  propertyId={property.id}
  onAssignmentChanged={() => loadProperties()}
/>
```
- Dialog to assign single caretaker to property
- Automatically removes from previous property
- Shows caretaker's contact info

#### PropertyAssignmentView
```tsx
<PropertyAssignmentView propertyId={property.id} />
```
- Read-only view of all assignments
- Organized by tabs (Proprietors, Technicians, Caretaker)
- Shows assignment details and dates

## Pages & Routes

### PropertiesManagement
Path: `/portal/properties-management`
- Updated to include assignment dialogs for each property
- Shows current staff assignments on property cards

### TechnicianDashboard
Path: `/portal/technician/dashboard`
- View profile and specialization
- List of assigned properties
- Stats: average rating, jobs completed, availability

### ProprietorDashboard
Path: `/portal/proprietor/dashboard`
- Business profile overview
- List of owned/co-owned properties
- Portfolio statistics
- Monthly income projections

### PropertyAssignmentAdmin
Path: `/portal/super-admin/assignments`
- Centralized management of all assignments
- Search and filter assignments
- Remove assignments
- Statistics dashboard

## Usage Flow

### For Super Admin

1. **Navigate to Properties Management** or **Property Assignment Admin**
2. **Select a Property**
3. **Assign Staff**:
   - Click "Assign Proprietor" → Select proprietor → Set ownership % → Save
   - Click "Assign Technician" → Select category → Select technician → Save
   - Click "Assign Caretaker" → Select caretaker → Save
4. **Monitor from Admin Dashboard** → View all assignments across the system

### For Proprietor

1. **Login with Proprietor Account**
2. **Access Proprietor Dashboard**
3. **View**:
   - All owned properties
   - Ownership percentages
   - Monthly income from each property
   - Property status and occupancy

### For Technician

1. **Login with Technician Account**
2. **Access Technician Dashboard**
3. **View**:
   - Assigned properties
   - Your specialization category
   - Property details and contact info
   - Performance stats (ratings, jobs completed)

### For Caretaker

1. **Login with Caretaker Account**
2. **Access assigned property**
3. **Can see**:
   - Full property details
   - Maintenance requests
   - Tenant communications

## Database Schema

### proprietor_properties
```sql
{
  id: UUID (PK),
  proprietor_id: UUID (FK) NOT NULL,
  property_id: UUID (FK) NOT NULL,
  ownership_percentage: DECIMAL(5,2) DEFAULT 100,
  assigned_by: UUID (FK) NOT NULL,
  assigned_at: TIMESTAMP DEFAULT NOW(),
  is_active: BOOLEAN DEFAULT TRUE,
  UNIQUE(proprietor_id, property_id)
}
```

### technician_property_assignments
```sql
{
  id: UUID (PK),
  technician_id: UUID (FK) NOT NULL,
  property_id: UUID (FK) NOT NULL,
  assigned_by: UUID (FK) NOT NULL,
  assigned_at: TIMESTAMP DEFAULT NOW(),
  is_active: BOOLEAN DEFAULT TRUE,
  UNIQUE(technician_id, property_id)
}
```

### caretakers (modified)
```sql
{
  id: UUID (PK),
  user_id: UUID (FK) UNIQUE NOT NULL,
  property_id: UUID (FK) UNIQUE,  -- Only one caretaker per property
  property_manager_id: UUID (FK),
  assigned_by: UUID (FK),
  assignment_date: TIMESTAMP DEFAULT NOW(),
  status: VARCHAR(50) CHECK (status IN ('active', 'inactive', 'suspended')),
  ...other fields
}
```

### technician_categories
```sql
{
  id: UUID (PK),
  name: VARCHAR(100) UNIQUE NOT NULL,
  description: TEXT,
  icon: TEXT,
  is_active: BOOLEAN DEFAULT TRUE,
  created_by: UUID (FK) NOT NULL,
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

## Row Level Security (RLS)

All assignment tables have RLS enabled with policies:

### proprietor_properties
- Proprietors can view their own properties
- Super admin can manage all assignments
- Property managers can view assignments for their properties

### technician_property_assignments
- Technicians can view their assignments
- Property managers can view technicians assigned to their properties
- Super admin can manage all assignments

### caretakers
- Caretakers can view their own assignment
- Property managers can view caretakers of their properties
- Super admin can manage all assignments

## API/Service Methods

### Load Proprietors with Assignments
```typescript
const { data } = await supabase
  .from('proprietor_properties')
  .select('*, proprietors(*, profiles:user_id(...)), properties(...)')
  .eq('property_id', propertyId)
  .eq('is_active', true);
```

### Load Technicians with Category
```typescript
const { data } = await supabase
  .from('technician_property_assignments')
  .select('*, technicians(*, category:category_id(...), profiles:user_id(...))')
  .eq('property_id', propertyId)
  .eq('is_active', true);
```

### Load Caretaker
```typescript
const { data } = await supabase
  .from('caretakers')
  .select('*, profiles:user_id(...)')
  .eq('property_id', propertyId)
  .eq('status', 'active')
  .single();
```

## Initialization

Before using the system:

1. **Run Database Migrations**:
   - Run: `20260211_add_technician_proprietor_caretaker_roles.sql`
   - Run: `20260213_initialize_technician_categories.sql`

2. **Create Users** with appropriate roles:
   - Role: 'proprietor' → Auto-creates proprietor record
   - Role: 'technician' → Auto-creates technician record (needs category assignment via admin)
   - Role: 'caretaker' → Auto-creates caretaker record

3. **Assign Categories** to technicians in admin interface before assigning to properties

## Future Enhancements

- [ ] Bulk assignment import (CSV/Excel)
- [ ] Assignment templates for similar properties
- [ ] Performance tracking per technician
- [ ] Automated caretaker rotation scheduling
- [ ] Payment tracking for proprietors
- [ ] Service request workflow integration
- [ ] Audit logs for all assignments
- [ ] Multi-language support for category names
