# Quick Start: Properties & Units System

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Database Setup ✅
```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM units_detailed;
SELECT COUNT(*) FROM properties;
```
Should return counts > 0 for both tables.

### Step 2: Start the Application
```bash
bun install
bun run dev
```

### Step 3: Test Tenant Registration
1. Go to `/register`
2. Select "Tenant / Looking to Rent"
3. Select "Westside Apartments" (or any property)
4. Wait for unit dropdown to populate
5. Select any unit (e.g., "Unit A1 - 1-Bedroom")
6. Fill in details and submit
✅ Registration complete!

### Step 4: Verify in Database
```sql
-- Check tenant was created
SELECT full_name, email, unit_id, property_id, status 
FROM profiles 
WHERE role = 'tenant' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check unit was reserved
SELECT unit_number, status, occupant_id 
FROM units_detailed 
WHERE occupant_id IS NOT NULL 
LIMIT 1;

-- Check verification request
SELECT tenant_id, unit_id, status 
FROM tenant_verifications 
WHERE status = 'pending' 
LIMIT 1;
```

### Step 5: Manager Approval
1. Create a property manager account (register as "Property Manager")
2. Select a property to manage
3. Login as that manager
4. Go to "Tenant Verification" section
5. Approve the pending tenant registration
✅ Tenant is now approved!

### Step 6: Check Admin Dashboard
1. Login as super admin
2. Go to Property Management
3. See the unit occupancy updated
4. View "Unit Details" showing occupied/vacant counts
✅ Dashboard works!

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Properties in Mock Data | 5 |
| Unit Specifications | 9 |
| Individual Units | 21 |
| Unit Types | Studios, 1-Bed, 2-Bed, 3-Bed, Villas |
| Status Options | vacant, occupied, reserved, maintenance |

---

## 🔑 Key Files Modified

```
src/pages/auth/RegisterPage.tsx          ← Unit selection added
src/components/portal/super-admin/PropertyManager.tsx  ← Unit display enhanced
supabase/migrations/                      ← Already has all migrations
```

---

## 📋 Workflows

### Tenant Registration
```
Register → Select Property → Select Unit → 
Unit Reserved (automatically) → Manager Approves → 
Unit Occupied → Tenant Active
```

### Manager Registration
```
Register → Select Properties → 
Super Admin Approves → Manager Active
```

### Property Admin View
```
View Property → See Unit Breakdown → 
Track Occupancy → Manage Assignments
```

---

## ⚠️ Common Issues

### "No units available"
✅ **Fix:** Check that property has vacant units
```sql
SELECT * FROM units_detailed 
WHERE status = 'vacant' 
LIMIT 5;
```

### Unit not updating to occupied
✅ **Fix:** Check RLS policies
```sql
SELECT * FROM units_detailed 
WHERE status = 'occupied';
```

### Tenant can't login after approval
✅ **Fix:** Check profile status is 'active'
```sql
SELECT full_name, status FROM profiles 
WHERE role = 'tenant' 
LIMIT 1;
```

---

## 🧪 Quick Test Sequence

```
1. Register tenant for Unit A1
   ✅ Check: unit_id is set in profiles
   ✅ Check: unit status = 'reserved'

2. Login as property manager
   ✅ Check: See pending verification
   
3. Approve tenant
   ✅ Check: unit status = 'occupied'
   ✅ Check: tenant status = 'active'
   
4. View admin dashboard
   ✅ Check: Occupancy shows correct count
   ✅ Check: Unit details visible
```

---

## 📱 API Examples

### Get Available Units for Registration
```javascript
const { data } = await supabase
  .from('units_detailed')
  .select('*')
  .eq('property_id', propertyId)
  .eq('status', 'vacant');
```

### Reserve Unit on Registration
```javascript
await supabase
  .from('units_detailed')
  .update({ status: 'reserved', occupant_id: userId })
  .eq('id', unitId);
```

### Get Tenant with Unit Info
```javascript
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    units_detailed(unit_number, unit_type, floor_number),
    properties(name, address)
  `)
  .eq('role', 'tenant')
  .single();
```

---

## ✅ Checklist for Deployment

- [ ] Database migrations executed
- [ ] Mock data populated (21 units)
- [ ] RegisterPage.tsx updated with unit selection
- [ ] PropertyManager.tsx updated with unit display
- [ ] Can register as tenant and select unit
- [ ] Manager can approve tenants
- [ ] Admin dashboard shows correct occupancy
- [ ] All notifications are sent
- [ ] Unit statuses update correctly

---

## 🎯 Success Indicators

✅ Tenant selects specific unit during registration
✅ Unit dropdown shows only vacant units
✅ Unit status changes: vacant → reserved → occupied
✅ One tenant per unit (unique constraint enforced)
✅ Manager gets notification with unit details
✅ Admin dashboard displays unit occupancy
✅ All approval workflows function correctly

---

## 📞 Support

- **Schema Questions:** See [DATABASE_SCHEMA.md](src/docs/DATABASE_SCHEMA.md)
- **Workflow Questions:** See [PROPERTIES_UNITS_IMPLEMENTATION.md](PROPERTIES_UNITS_IMPLEMENTATION.md)
- **Testing Questions:** See [VERIFICATION_CHECKLIST_UNITS.md](VERIFICATION_CHECKLIST_UNITS.md)

---

**Ready to test? Start with Step 1! 🚀**
