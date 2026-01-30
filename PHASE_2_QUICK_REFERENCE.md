# Phase 2 Quick Reference - New Workflows

## 👥 USER MANAGEMENT WORKFLOW

### For SuperAdmins

#### **Add New User Manually**
1. Go to **User Management** → Click **"Add User"**
2. Fill form:
   - First Name *
   - Last Name *
   - Email *
   - Phone (optional)
   - Password * (minimum 6 chars)
   - Initial Role (defaults to Tenant)
3. Click **"Create User"**
4. User appears in appropriate tab (Unassigned or Assigned)

#### **Approve Unassigned User & Assign Role**
1. Go to **User Management** → **Unassigned Users** tab
2. Find user needing approval
3. Click **Shield Icon** → Assign Role dialog opens
4. Select role from dropdown:
   - `tenant` - Tenant in properties
   - `property_manager` - Manages properties
   - `super_admin` - Full system access
   - `accountant` - Financial reporting
   - `maintenance` - Building maintenance
5. Click **"Assign Role"**
6. User automatically moves to **Assigned Users** tab
7. User gains role-based access

#### **Change User Status**
1. Find user in Assigned Users tab
2. Click status dropdown (currently "Active")
3. Select new status:
   - `active` - User can access system
   - `suspended` - User access blocked
   - `pending` - Waiting for approval
4. Status updates immediately

#### **Remove User**
1. Find user (any tab)
2. Click **Trash Icon**
3. Confirm deletion
4. User removed from system

### User Status Transitions

```
Sign Up (Tenant)
    ↓
Stored in Profiles (role=tenant, status=pending)
    ↓
Appears in "Unassigned Users"
    ↓
SuperAdmin Reviews
    ↓
Assign Role (→ property_manager, super_admin, accountant, maintenance)
    ↓
Move to "Assigned Users"
    ↓
User gains role-based access
```

---

## 🏢 PROPERTY MANAGEMENT WORKFLOW

### For SuperAdmins & Property Managers

#### **Create New Property**
1. Go to **Property Management** → Click **"Add Property"**
2. Fill **Property Information:**
   - Property Name * (e.g., "Westlands Luxury Apartments")
   - City * (e.g., "Nairobi")
   - Full Address * (e.g., "Mpaka Road, Westlands")
   - Description (optional)
   - Property Type:
     - Apartment Complex
     - Commercial
     - House
     - Mixed Use

3. Configure **Unit Types & Pricing:**
   
   For each unit type (Bedsitter, 1-Bedroom, 2-Bedroom, Studio, Shop):
   - **Total Units:** How many units of this type?
   - **Base Price (Monthly):** Rent per unit
   - **Size Range:** (auto-calculated from variants)
   
   Example:
   ```
   Bedsitter:
     Total Units: 10
     Base Price: 15,000 KES
   
   1-Bedroom:
     Total Units: 5
     Base Price: 25,000 KES
   
   2-Bedroom:
     Total Units: 3
     Base Price: 40,000 KES
   ```

4. **Expected Monthly Income** shows automatically:
   - (10 × 15,000) + (5 × 25,000) + (3 × 40,000) = **280,000 KES**
   
5. Click **"Create Property"**

6. Property now appears in list with stats:
   - Total units: 18
   - Current occupancy: 0% (0/18)
   - Monthly income: 280,000 KES (at full capacity)
   - Projected income: 0 KES (currently empty)

#### **View Property Details**
1. Find property in list
2. Click **Eye Icon** for full details
3. View:
   - Basic info (name, address, city)
   - Unit specifications by type
   - Current occupancy status
   - Expected income breakdown
   - Unit list (when implemented)

#### **Delete Property**
⚠️ **Warning:** Also deletes all associated units and leases
1. Find property in list
2. Click **Trash Icon**
3. Confirm deletion
4. Property removed with all data

#### **Search & Filter Properties**
- **Search Box:** Find by property name or address
- **Status Filter:** View Active, Maintenance, or Inactive properties

---

## 📊 UNDERSTANDING THE DASHBOARDS

### User Management Dashboard

| Card | Shows | Updates |
|------|-------|---------|
| **Total Users** | Count of all users | Real-time |
| **Unassigned** | Users needing approval | Real-time |
| **Super Admins** | System administrators | Real-time |
| **Property Mgrs** | Property managers | Real-time |
| **Tenants** | Active tenants | Real-time |
| **Assigned** | Users with roles | Real-time |

### Property Management Dashboard

| Card | Shows | Calculation |
|------|-------|-------------|
| **Total Properties** | Number of properties | COUNT(properties) |
| **Occupancy %** | Overall vacancy | occupied_units / total_units |
| **Monthly Income** | Full capacity income | SUM(units × price) for all properties |
| **Projected Income** | Current occupancy income | Monthly income × (occupancy rate) |

---

## 💰 HOW INCOME PROJECTION WORKS

### Example Scenario
```
Property: Westlands Apartments
├── Bedsitter: 10 units @ 15,000 KES = 150,000/month
├── 1-Bedroom: 5 units @ 25,000 KES = 125,000/month
└── 2-Bedroom: 3 units @ 40,000 KES = 120,000/month

Total Monthly Income (Full Capacity): 395,000 KES

Current Occupancy: 8/18 units (44%)
Projected Monthly Income: 395,000 × 0.44 = 173,800 KES
Annual Projection: 173,800 × 12 = 2,085,600 KES
```

### What Updates Income?
Income automatically recalculates when:
1. ✅ New property created
2. ✅ Unit specifications added/modified
3. ✅ Unit type count changed
4. ✅ Base price modified
5. ✅ Occupancy status changed
6. ✅ Tenants added/removed from units

**Note:** This happens automatically via database triggers - no manual calculations needed!

---

## 🔑 UNIT TYPES EXPLAINED

### **Bedsitter**
- Smallest unit type
- Typically 300-400 sqft
- Single open-plan room with bathroom
- Affordable entry-level housing
- Typical rent: 12,000-18,000 KES

### **Studio**
- Small self-contained unit
- Similar size to bedsitter
- May have separate kitchenette
- Good for single occupants
- Typical rent: 15,000-20,000 KES

### **1-Bedroom**
- One bedroom + living area + kitchen
- Typically 500-700 sqft
- Family-suitable
- Mid-range pricing
- Typical rent: 20,000-35,000 KES

### **2-Bedroom**
- Two bedrooms + living area + kitchen
- Typically 800-1000 sqft
- Family-focused
- Premium pricing
- Typical rent: 35,000-55,000 KES

### **Shop**
- Commercial unit for retail/business
- Variable sizes
- Ground floor typically
- Business rent
- Typical rent: 30,000-100,000 KES (variable)

---

## 📋 COMMON TASKS

### Task: Add 5 new bedsitters to existing property
1. Go to Property Management
2. Find property in list
3. Click property to view
4. Go to "Unit Specifications" section
5. Find "Bedsitter" specification
6. Click edit/add
7. Increase "Total Units" by 5
8. Income automatically recalculates
9. Done! New units available for tenants

### Task: Change rent price for 1-bedrooms
1. Go to Property Management
2. Find property
3. View property details
4. Edit "1-Bedroom" specification
5. Change "Base Price" to new amount
6. Income projections update automatically
7. Done!

### Task: Add new property manager
1. Go to User Management
2. Click "Add User"
3. Fill user details
4. Set Initial Role to "property_manager"
5. Click "Create User"
6. User appears in Assigned Users tab
7. Can now access property management features

### Task: Suspend problematic tenant
1. Go to User Management → Assigned Users
2. Find tenant in list
3. Click status dropdown
4. Select "suspended"
5. Tenant immediately blocked from system
6. Can reactivate anytime

---

## ⚙️ BEHIND THE SCENES

### Database Tables Updated

**When you create a property:**
```sql
-- Inserts into properties table
INSERT INTO properties (name, address, city, type, status, total_units)

-- Inserts unit specifications for each type you added
INSERT INTO unit_specifications (property_id, unit_type_name, total_units_of_type, base_price)

-- Automatically calculates and stores income
INSERT INTO property_income_projections (property_id, total_monthly_income, projected_monthly_income)
```

**When occupancy changes:**
```sql
-- Trigger automatically updates:
UPDATE properties SET occupied_units = 8, vacancy_rate = 55%
UPDATE property_income_projections SET projected_monthly_income = 173_800
```

### Views That Power the UI

**`unassigned_users` view:** Shows all users with:
- `role IS NULL` OR `role = 'tenant'`
- `status = 'pending'` OR `status IS NULL`

**`assigned_users` view:** Shows all users with:
- `role IN ('super_admin', 'property_manager', ...)`
- `status = 'active'`

---

## ✅ VERIFICATION CHECKLIST

After creating property, verify:
- [ ] Property appears in list
- [ ] Correct property name shown
- [ ] Correct city shown
- [ ] Correct total unit count
- [ ] Correct occupancy percentage
- [ ] Monthly income matches calculation
- [ ] All unit types configured correctly

After assigning user role, verify:
- [ ] User moved from Unassigned to Assigned tab
- [ ] Correct role displayed
- [ ] Status shows "active"
- [ ] User email correct
- [ ] Phone number correct (if provided)

---

## 🆘 TROUBLESHOOTING

### "Property not showing in list"
1. Check that property was successfully created (no error toast)
2. Refresh the page
3. Check filters (status, search query)
4. Check Supabase table directly

### "Can't assign role to user"
1. Verify user is in Unassigned tab
2. Click shield icon again
3. Select role and confirm
4. Should move to Assigned tab

### "Income calculation seems wrong"
1. Verify all unit counts entered correctly
2. Verify all prices entered correctly
3. Check database trigger logs
4. Manual recalculation: SUM(units × price for each type)

### "User can't login after role assignment"
1. Verify status is "active" (not "suspended" or "pending")
2. Verify email is correct
3. User may need to refresh browser
4. Check email verification (if required by auth)

---

**Last Updated:** January 30, 2026
**Version:** 2.0 (Phase 2 Complete)
**Ready for:** Production Deployment

