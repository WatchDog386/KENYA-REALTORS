# SuperAdmin Unit Management - IMPLEMENTATION GUIDE

## OVERVIEW

You've requested a complete system where SuperAdmins can manage unit details at the property level. Instead of just seeing "30 units" for a property, SuperAdmins can now:

1. **Create detailed unit configurations** (Bedsitter, 1BR, 2BR, etc.)
2. **Generate individual units** with specific floor numbers, prices, and descriptions
3. **Organize units hierarchically**: Building → Floor → Unit Type → Individual Unit

This system works with "Sunrise Heights" property as a test case.

---

## STEP 1: DEPLOY DATABASE SCHEMA

**File:** `supabase/migrations/20260218_upgrade_property_units.sql`

### Option A: Run Script
```bash
.\scripts\DEPLOY_UNIT_SCHEMA_MANUAL.bat
```

### Option B: Manual Execution
1. Open [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create new query
5. Copy content from `supabase/migrations/20260218_upgrade_property_units.sql`
6. Click **Run**

### Tables Modified:
- ✅ `properties` - Added `number_of_floors`
- ✅ `units` - Added `floor_number`, `description`, `price`
- ✅ `property_unit_types` - Added `description`, `bedrooms`, `bathrooms`

---

## STEP 2: TEST THE NEW UI

### Access SuperAdmin Dashboard
1. Go to http://localhost:8081/
2. Login as SuperAdmin
3. Navigate to **Super Admin** → **Property Management**

### Property List Screen
- You'll see all properties in a table
- Each property now has a **"Units"** button (with grid icon)
- This is where the unit management happens

---

## STEP 3: SETUP "SUNRISE HEIGHTS" PROPERTY

### 3A: Create the Property
1. Click **"Add Property"** button (orange)
2. Fill in:
   - **Property Name:** Sunrise Heights
   - **Location:** Westlands, Nairobi
   - **Floors:** 5 (NEW FIELD)
   - **Type:** Apartment
   - **Description:** Modern apartment complex
   - **Image URL:** (optional)

3. Add Unit Types (these are categories, not individual units):
   - **Type 1:** Name "Bedsitter", Count 20, Price 40000
   - **Type 2:** Name "One Bedroom", Count 20, Price 65000
   - **Type 3:** Name "Two Bedroom", Count 10, Price 95000

4. Click **"Create Property"** ✅

### 3B: Assign a Property Manager
1. In property table, find "Sunrise Heights"
2. Click the **"Assign Manager"** button (user+ icon)
3. Select a property manager from dropdown
4. Click **"Assign Manager"** ✅

---

## STEP 4: GENERATE INDIVIDUAL UNITS

### Access Unit Manager
1. In property table, click **"Units"** button on Sunrise Heights row
2. You'll enter the "Detailed Unit Creator" screen

### Generate Bedsitter Units (Floor 1)
1. **Unit Type:** Select "Bedsitter (20 planned) - KES 40000"
2. **Floor:** 1
3. **Count:** 10
4. **Number Pattern:**
   - Prefix: `A-`
   - Start: `101`
5. Click **"Generate"** ✅

**Result:** Creates units `A-101`, `A-102`, ... `A-110` on Floor 1

### Generate One Bedroom Units (Floor 2)
1. **Unit Type:** Select "One Bedroom (20 planned) - KES 65000"
2. **Floor:** 2
3. **Count:** 10
4. **Number Pattern:**
   - Prefix: `B-`
   - Start: `201`
5. Click **"Generate"** ✅

**Result:** Creates units `B-201`, `B-202`, ... `B-210` on Floor 2

### Continue for Other Floors
- Floor 3: One Bedroom (remaining 10) → `B-301` to `B-310`
- Floor 4: Two Bedroom (all 10) → `C-401` to `C-410`
- Floor 5: Two Bedroom (additional space) → `C-501` to `C-510`

### View Units Table
The table shows:
```
Unit#   Floor   Type            Price(Override)   Status
A-101   1       Bedsitter       KES 40000         Available
A-102   1       Bedsitter       KES 40000         Available
B-201   2       One Bedroom     KES 65000         Available
B-202   2       One Bedroom     KES 65000         Available
...
```

**Total Units Generated:** 50 units across 5 floors

---

## STEP 5: VERIFY IN DATABASE

### Supabase Verification
Check these tables:

**properties:**
```
id: xxx
name: "Sunrise Heights"
location: "Westlands, Nairobi"
number_of_floors: 5
total_units: 50 (computed)
```

**property_unit_types:**
```
Bedsitter (20 planned @ 40K)
One Bedroom (20 planned @ 65K)
Two Bedroom (10 planned @ 95K)
```

**units:**
```
A-101 (Floor 1, Bedsitter, 40K, Available)
A-102 (Floor 1, Bedsitter, 40K, Available)
B-201 (Floor 2, One Bedroom, 65K, Available)
...
C-410 (Floor 4, Two Bedroom, 95K, Available)
```

---

## STEP 6: TEST WITH MANAGER PORTAL (FUTURE)

When manager portal integration is complete:

1. Manager logs in → sees assigned property
2. Clicks **"View Units"**
3. Sees detailed table:
   ```
   Unit    Type        Location    Price    Status
   A-101   Bedsitter   Floor 1     40K      Available
   A-102   Bedsitter   Floor 1     40K      Available
   B-201   One BR      Floor 2     65K      Available
   ```
4. Clicks **"Assign to Tenant"** → assigns unit to tenant
5. Status changes to "Occupied"

---

## KEY FEATURES EXPLAINED

### 1. Three-Level Hierarchy
```
Property (Sunrise Heights)
  ├─ Floor 1
  │  ├─ A-101 (Bedsitter)
  │  ├─ A-102 (Bedsitter)
  │  └─ A-103 (Bedsitter)
  ├─ Floor 2
  │  ├─ B-201 (One Bedroom)
  │  ├─ B-202 (One Bedroom)
  │  └─ B-203 (One Bedroom)
  └─ ... (Floors 3-5)
```

### 2. Flexible Pricing
- Default price from unit type (e.g., Bedsitter = 40K)
- Can override price for individual units if needed
- Example: Unit A-101 normally 40K, special negotiation → set to 38K

### 3. Smart Naming Patterns
Generate 10 units with one click:
- Pattern: `A-` + `101` → Creates `A-101`, `A-102`, ..., `A-110`
- Pattern: `B-` + `201` → Creates `B-201`, `B-202`, ..., `B-210`
- Flexible enough for any naming scheme

### 4. Status Tracking
- **Available** - Ready to rent
- **Occupied** - Tenant assigned
- **Maintenance** - Offline (future)
- **Reserved** - Pending tenant (future)

---

## DATABASE STRUCTURE

### property_unit_types (Category Level)
```
{
  id: uuid,
  property_id: uuid,
  name: "Bedsitter",           // Type name
  units_count: 20,              // How many of this type planned
  price_per_unit: 40000,        // Standard price
  description: "Small studio"   // Details
}
```

### units (Individual Unit Level)
```
{
  id: uuid,
  property_id: uuid,
  unit_type_id: uuid,
  unit_number: "A-101",         // Specific unit identifier
  floor_number: 1,              // Which floor
  price: null,                  // If null, use type price
  status: "available",          // Current state
  description: "Facing east"    // Optional notes
}
```

---

## TROUBLESHOOTING

### Issue: "Units" Button Not Showing
**Solution:** Run database migration first. New columns must exist.

### Issue: Can't Generate Units
**Solution:** 
1. Make sure you created unit types FIRST
2. Unit type must be selected for generating

### Issue: Duplicate Unit Numbers
**Solution:** 
1. Unit numbers must be unique per property
2. Change prefix or start number
3. Example: Instead of `A-101`, try `A-201`

### Issue: Prices Not Showing
**Solution:** 
1. If empty, unit uses type's default price
2. To set custom price, use the "Price Override" field (coming soon)

---

## NEXT STEPS FOR MANAGER PORTAL

When you're ready to connect the manager side:

1. Update `ManagerDashboard.tsx` to show unit details table
2. Update `ManagerUnits.tsx` to JOIN with:
   ```sql
   SELECT u.*, put.name as unit_type_name, put.price_per_unit
   FROM units u
   JOIN property_unit_types put ON u.unit_type_id = put.id
   WHERE u.property_id = ?
   ORDER BY u.floor_number, u.unit_number
   ```
3. Add unit selection dialog when assigning tenants
4. Track unit status changes (available → occupied)

---

## QUICK REFERENCE

| Feature | Location | User |
|---------|----------|------|
| Create Property | PropertyManager.tsx | SuperAdmin |
| Configure Unit Types | PropertyManager.tsx | SuperAdmin |
| Generate Units | PropertyUnitManager.tsx | SuperAdmin |
| View Unit Details | (Coming Soon) | Manager |
| Assign Unit to Tenant | (Coming Soon) | Manager |
| Track Occupancy | (Coming Soon) | Everyone |

---

## FILES INVOLVED

### New Components:
- `src/components/portal/super-admin/properties/PropertyUnitManager.tsx`

### Modified Components:
- `src/components/portal/super-admin/PropertyManager.tsx`

### Services:
- `src/services/propertyService.ts`

### Database:
- `supabase/migrations/20260218_upgrade_property_units.sql`

---

**Last Updated:** February 18, 2026  
**Status:** ✅ Ready for Testing  
**Test Property:** Sunrise Heights
