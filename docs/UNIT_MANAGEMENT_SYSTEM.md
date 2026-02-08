## SuperAdmin Dashboard - Advanced Unit Management System
### Architecture & Schema Updates

This document summarizes the architectural changes made to enable SuperAdmins to manage detailed unit configurations at the property level.

---

## 1. DATABASE SCHEMA CHANGES

### New Migration: `20260218_upgrade_property_units.sql`

#### Changes to `properties` table:
- Added `number_of_floors INTEGER DEFAULT 1` - Track building height for organizational purposes

#### Changes to `units` table:
- Added `floor_number INTEGER` - Which floor the unit is on
- Added `description TEXT` - Additional unit details
- Added `price NUMERIC` - Override price for individual units (uses property_unit_types price if NULL)

#### Changes to `property_unit_types` table:
- Added `description TEXT` - Unit type description
- Added `bedrooms INTEGER DEFAULT 0` - Number of bedrooms in this type
- Added `bathrooms NUMERIC DEFAULT 0` - Number of bathrooms in this type

#### New Database Function: `generate_units_for_property()`
- Bulk generate units with proper naming patterns
- Syntax: `generate_units_for_property(property_id, unit_type_id, start_floor, end_floor, units_per_floor, naming_pattern)`
- Example pattern: `"A-{floor}-{n}"` generates `"A-1-1"`, `"A-1-2"`, etc.

---

## 2. COMPONENT ARCHITECTURE

### PropertyManager.tsx (Enhanced)
**File:** `src/components/portal/super-admin/PropertyManager.tsx`

**New Features:**
- Added `propertyForUnits` state to track unit management mode
- Integrated ImportPropertyUnitManager component
- New "Units" button in property actions table
- Conditional rendering to switch between property list and unit manager views

**Key Changes:**
```typescript
const [propertyForUnits, setPropertyForUnits] = useState<Property | null>(null);
const [formData, setFormData] = useState<CreatePropertyDTO>({
  // ... existing fields
  number_of_floors: 1  // NEW
});
```

### PropertyUnitManager.tsx (NEW Component)
**File:** `src/components/portal/super-admin/properties/PropertyUnitManager.tsx`

**Purpose:** Dedicated UI for managing detailed unit configurations per property

**Features:**

1. **Detailed Unit Generator**
   - Select unit type from configured types for the property
   - Set floor number (1 to property.number_of_floors)
   - Specify count of units to generate
   - Custom numbering pattern (prefix + starting number)
   - Optional price override per unit

2. **Units Table Display**
   - Shows all units in the property
   - Displays: Unit Number, Floor, Type, Price (with override indicator), Status
   - Color-coded status badges (available, occupied, maintenance)
   - Delete functionality with confirmation

3. **Responsive Design**
   - Mobile-friendly form layout
   - Compact table for reviewing units
   - Back button to return to property list

**UI Layout:**
```
┌─────────────────────────────────────────┐
│  [Back] Property Name - Unit Management │
│  (X floors, Y units total)              │
├─────────────────────────────────────────┤
│ DETAILED UNIT CREATOR                   │
│ ┌─────────────────────────────────────┐ │
│ │ Unit Type: [Dropdown]               │ │
│ │ Floor: [1-X]  Count: [1-50]         │ │
│ │ Pattern: [Prefix] [Start#] [Gen]    │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ UNITS IN PROPERTY                       │
│ ┌─ Table ─────────────────────────────┐ │
│ │ Unit# │ Floor │ Type │ Price │ Act │ │
│ │  A101 │   1   │ Bed2 │ 50K   │ DEL │ │
│ │  A102 │   1   │ Bed2 │ 50K   │ DEL │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 3. SERVICE UPDATES

### propertyService.ts

**Updated Interfaces:**

```typescript
export interface Property {
  // ... existing fields
  number_of_floors?: number;  // NEW
}

export interface CreatePropertyDTO {
  // ... existing fields  
  number_of_floors?: number;  // NEW
}
```

**Updated Methods:**

```typescript
async createProperty(property: CreatePropertyDTO) {
  const { data: propData, error: propError } = await supabase
    .from('properties')
    .insert({
      // ... existing fields
      number_of_floors: property.number_of_floors || 1  // NEW
    })
  // ... rest of logic
}
```

---

## 4. DATA FLOW ARCHITECTURE

### SuperAdmin Workflow:

```
SuperAdmin Dashboard (PropertyManager.tsx)
    ↓ [Click "Units" button on property row]
    ↓
PropertyUnitManager Component Loads
    ↓
Displays Unit Generator Form
    ↓
SuperAdmin specifies:
  - Unit Type (e.g., "Bedsitter")
  - Floor Number
  - Count of Units
  - Numbering Pattern (e.g., "A-" + "101")
    ↓
Form submits to Supabase
    ↓
Insert into units table:
  {
    property_id: xxx,
    unit_type_id: yyy,
    unit_number: "A-101",
    floor_number: 1,
    status: "available"
  }
    ↓
Table refreshes to show new units
    ↓
SuperAdmin can edit/delete units as needed
```

### Manager Portal Workflow (future integration):

```
Manager Dashboard (ManagerDashboard.tsx)
    ↓
Displays assigned property details
    ↓
Shows available units with full details:
  - Unit Number (A-101)
  - Floor Number (1)
  - Unit Type (Bedsitter)
  - Price (50,000 KES)
  - Status (available/occupied)
    ↓
Manager clicks "Assign to Tenant"
    ↓
Creates assignment in tenants table
```

---

##  5. TESTING WITH "SUNRISE HEIGHTS" PROPERTY

### Example Setup:

1. **Create Property:**
   - Name: Sunrise Heights
   - Location: Westlands, Nairobi
   - Type: Apartment
   - Floors: 5

2. **Create Unit Types:**
   - Bedsitter: 10 units @ 40,000 KES each
   - One Bedroom: 15 units @ 65,000 KES each
   - Two Bedroom: 8 units @ 95,000 KES each

3. **Generate Units via PropertyUnitManager:**
   - Unit Type: Bedsitter
   - Floor: 1
   - Count: 5
   - Pattern: A-101, A-102, A-103, A-104, A-105
   
   - Unit Type: One Bedroom
   - Floor: 2
   - Count: 5
   - Pattern: B-201, B-202, B-203, B-204, B-205
   
   ... (repeat for other floors and types)

4. **Result in Units Table:**
   ```
   Unit#   Floor   Type            Price   Status
   A-101   1       Bedsitter       40K     Available
   A-102   1       Bedsitter       40K     Available
   B-201   2       One Bedroom     65K     Available
   B-202   2       One Bedroom     65K     Available
   ...
   ```

---

## 6. DEPLOYMENT REQUIREMENTS

### SQL Migration Deployment:

**File:** `supabase/migrations/20260218_upgrade_property_units.sql`

**Steps:**
1. Copy the SQL from the migration file
2. Go to Supabase Dashboard → SQL Editor
3. Paste and execute the SQL
4. Verify columns are added to `properties`, `units`, and `property_unit_types` tables

**Helper Script:**
- `scripts/DEPLOY_UNIT_SCHEMA_MANUAL.bat` - Displays the SQL content for manual execution

### Runtime Requirements:
- None - new columns are optional with sensible defaults
- Backward compatible with existing records

---

## 7. FUTURE ENHANCEMENTS

1. **Bulk Import:**
   - CSV upload for creating units in batches

2. **Unit Status Management:**
   - Update status (available → occupied → maintenance)
   - Track vacancy rates per floor

3. **Floor-based Reports:**
   - Occupancy by floor
   - Revenue forecasting per floor

4. **Property Analytics:**
   - Unit turnover rate
   - Average vacancy duration
   - Revenue per floor

---

## 8. FILES CREATED/MODIFIED

### New Files:
- `src/components/portal/super-admin/properties/PropertyUnitManager.tsx`
- `supabase/migrations/20260218_upgrade_property_units.sql`
- `scripts/DEPLOY_UNIT_SCHEMA_MANUAL.bat`

### Modified Files:
- `src/components/portal/super-admin/PropertyManager.tsx` - Added unit manager integration
- `src/services/propertyService.ts` - Added `number_of_floors` field support

---

## 9. TECHNICAL NOTES

- **Naming Pattern Logic:** Simple string replacement of `{floor}` and `{n}` placeholders
- **Price Override:** NULL values in units.price fall back to property_unit_types.price_per_unit
- **Unique Constraint:** Units are unique per property (property_id + unit_number)
- **Cascading Deletes:** Deleting a property cascades to all its units
- **RLS:** Ensure Supabase RLS policies allow admins to modify units for their assigned properties

---

**Last Updated:** February 18, 2026
**Component Status:** Ready for SuperAdmin Testing
