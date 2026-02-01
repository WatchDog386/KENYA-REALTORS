# Properties & Units System Architecture

## 📊 Database Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROPERTIES TABLE                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ id | name | address | city | property_type | total_units   │   │
│  │ property_manager_id (FK → profiles)                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────────────────┬──┘
                 │                                                  │
        ┌────────┴─────────┐                            ┌─────────┴────────┐
        │                  │                            │                  │
    ┌───▼────────────────────────┐         ┌───────────▼──────────────────┐
    │ UNIT_SPECIFICATIONS        │         │  UNITS_DETAILED              │
    ├────────────────────────────┤         ├────────────────────────────┤
    │ id                         │         │ id                         │
    │ property_id (FK)           │         │ property_id (FK)           │
    │ unit_type_name             │◄──────►│ unit_specification_id (FK)│
    │ unit_category              │         │ unit_number                │
    │ total_units_of_type        │         │ unit_type                  │
    │ base_price                 │         │ floor_number               │
    │ available_floors           │         │ price_monthly              │
    │ features[], amenities[]    │         │ occupant_id (FK→profiles)◄─┐
    └────────────────────────────┘         │ status (vacant|occupied)   │
                                           │ move_in_date               │
                                           │ move_out_date              │
                                           └────────────────────────────┘
                                                         │
                                        ┌────────────────┼────────────────┐
                                        │                │                │
                        ┌───────────────▼──┐      ┌─────▼──────────┐ ┌───▼────────────┐
                        │ PROFILES (Tenant)│      │ TENANT_VERIF.. │ │ NOTIFICATIONS  │
                        ├──────────────────┤      ├────────────────┤ ├────────────────┤
                        │ id (user_id)     │      │ id             │ │ id             │
                        │ full_name        │      │ tenant_id (FK) │ │ recipient_id   │
                        │ email            │      │ unit_id (FK)   │ │ sender_id      │
                        │ role: 'tenant'   │      │ property_id    │ │ type: 'tenant_ │
                        │ status: 'pending'│      │ status: 'pend' │ │ verification'  │
                        │ unit_id (FK) ────┼─────│ house_number   │ │ message        │
                        │ property_id (FK) │      │ created_at     │ │ read_at        │
                        │ created_at       │      └────────────────┘ └────────────────┘
                        └──────────────────┘
```

## 🔄 Data Flow: Tenant Registration

```
STEP 1: Tenant Registration Form
┌─────────────────────────┐
│  Register Page          │
│  ├─ Select Role: Tenant │
│  ├─ Select Property ────┼────► Query properties table
│  ├─ Select Unit ────────┼────► Query units_detailed (vacant only)
│  ├─ Fill Form           │
│  └─ Click Register      │
└────────────┬────────────┘
             │
             ▼
STEP 2: Create Auth User & Profile
┌─────────────────────────────────────────┐
│  Supabase Auth                          │
│  ├─ auth_users.create()                 │
│  └─ Return: user_id                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  profiles table INSERT               │
│  ├─ id = user_id                    │
│  ├─ full_name                       │
│  ├─ email                           │
│  ├─ role = 'tenant'                 │
│  ├─ status = 'pending'              │
│  ├─ unit_id = selected_unit_id ◄────┼─── NEW: Links to specific unit
│  ├─ property_id = selected_property │
│  └─ created_at = NOW()              │
└──────────────────────────────────────┘

STEP 3: Reserve Unit
┌──────────────────────────────────────┐
│  units_detailed table UPDATE         │
│  WHERE id = unit_id                  │
│  SET:                                │
│  ├─ status = 'reserved' (was vacant) │
│  ├─ occupant_id = user_id ◄──────────┼─── Links tenant to unit
│  └─ updated_at = NOW()               │
└──────────────────────────────────────┘

STEP 4: Create Verification Request
┌───────────────────────────────────────┐
│  tenant_verifications INSERT          │
│  ├─ tenant_id = user_id               │
│  ├─ unit_id = selected_unit_id ◄──────┼─── Links verification to unit
│  ├─ property_id = selected_property   │
│  ├─ house_number = unit.unit_number   │
│  ├─ status = 'pending'                │
│  └─ created_at = NOW()                │
└───────────────────────────────────────┘

STEP 5: Notify Manager
┌───────────────────────────────────────────────────┐
│  notifications INSERT                            │
│  ├─ recipient_id = property.property_manager_id  │
│  ├─ sender_id = tenant_user_id                   │
│  ├─ type = 'tenant_verification'                 │
│  ├─ related_entity_id = tenant_user_id           │
│  ├─ title = "New Tenant Registration"            │
│  ├─ message = "John Doe registered for Unit A1 at Westside Apartments"
│  └─ created_at = NOW()                           │
└───────────────────────────────────────────────────┘

STEP 6: Redirect to Login
└─────────────────────────────────────┘
 Tenant notified: "Your details sent to manager for verification"
 Redirect to /login after 2 seconds
```

## ✅ Manager Approval Flow

```
┌─────────────────────────────────────────┐
│ Property Manager Portal                 │
│ └─ TenantVerificationPanel              │
│    ├─ Lists pending verifications       │
│    ├─ Shows tenant info                 │
│    ├─ Shows Unit Details ◄──────────────┼─── NEW: Shows actual unit info
│    │   ├─ Unit Number                   │
│    │   ├─ Unit Type                     │
│    │   ├─ Floor Number                  │
│    │   └─ Monthly Price                 │
│    └─ [Approve] [Reject]                │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
      APPROVE            REJECT
        │                   │
        ▼                   ▼
  ┌──────────────┐    ┌──────────────┐
  │ Update Status│    │ Update Status│
  ├──────────────┤    ├──────────────┤
  │ tenants.     │    │ tenants.     │
  │ status =     │    │ status =     │
  │ 'verified'   │    │ 'rejected'   │
  │              │    │              │
  │ units_       │    │ units_       │
  │ detailed.    │    │ detailed.    │
  │ status =     │    │ status =     │
  │ 'occupied'   │    │ 'vacant'     │
  │              │    │              │
  │ profiles.    │    │ Delete unit_ │
  │ status =     │    │ id from      │
  │ 'active'     │    │ profiles     │
  │              │    │              │
  │ NOTIFY       │    │ NOTIFY       │
  │ Tenant OK    │    │ Tenant NO    │
  └──────────────┘    └──────────────┘
```

## 📊 Admin Dashboard Display

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPERTY MANAGEMENT DASHBOARD                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STATS CARDS                                                     │
│  ├─ Total Properties: 5     ├─ Units & Occupancy: 75%            │
│  ├─ Monthly Revenue: 2.1M   ├─ Assigned Managers: 3              │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ TABLE                                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Property │ Location │ Type  │ Status │ Unit Details │ Occupancy  │
│────────────────────────────────────────────────────────────────  │
│ Westside │ Nairobi  │ Apt   │ Active │ Total: 12    │ ████░ 65%  │
│ Apts     │          │       │        │ 8 occupied   │            │
│          │          │       │        │ 4 vacant     │            │
├─────────────────────────────────────────────────────────────────┤
│ Downtown │ Nairobi  │ Com   │ Active │ Total: 8     │ ██░░░░ 25% │
│ Plaza    │          │       │        │ 2 occupied   │            │
│          │          │       │        │ 6 vacant     │            │
├─────────────────────────────────────────────────────────────────┤
│ Suburban │ Nairobi  │ House │ Active │ Total: 5     │ █████░ 83% │
│ Villas   │          │       │        │ 4 occupied   │            │
│          │          │       │        │ 1 vacant     │            │
└─────────────────────────────────────────────────────────────────┘

                    NEW: Unit Details Column ◄────── Shows:
                                               - Total units
                                               - Occupied count
                                               - Vacant count

                    NEW: Occupancy Column ◄──────── Shows:
                                                    - Visual bar
                                                    - Percentage
```

## 🔐 Access Control (RLS Policies)

```
PROFILES Table
├─ Tenant can see: Own profile + unit/property info
├─ Manager can see: Profiles of their managed property's tenants
└─ Admin can see: All profiles

UNITS_DETAILED Table
├─ Tenant can see: Their assigned unit details
├─ Manager can see: Units in their managed properties
└─ Admin can see: All units

TENANT_VERIFICATIONS Table
├─ Tenant can see: Own verification status
├─ Manager can see: Verifications for their properties
└─ Admin can see: All verifications

NOTIFICATIONS Table
├─ Users can see: Notifications sent to them
├─ Users can see: Notifications they sent (read-only)
└─ Admin can see: All notifications
```

## 📈 Status Transitions

```
Unit Status Transitions:
┌─────────┐     (Tenant      ┌──────────┐    (Tenant        ┌─────────┐
│ VACANT  │──── Registers)───│ RESERVED │──── Approved)─────│ OCCUPIED│
└─────────┘                  └──────────┘                    └─────────┘
    │                              │                              │
    │                         (Manager                      (Unit Available
    │                         Rejects)                      & Tenant Leaves)
    │                              │                              │
    └──────────────────────────────┴──────────────────────────────┘

Alternative Path:
┌─────────┐     (Maintenance  ┌──────────────┐
│ VACANT  │─────  needed)─────│ MAINTENANCE  │
└─────────┘                    └──────────────┘
                                      │
                                 (Repaired)
                                      │
                                      ▼
                                   VACANT
```

## 🎯 Key Constraints

```
UNIQUE Constraints:
├─ properties(name) ─────────── No duplicate property names
├─ units_detailed(property_id, unit_number) ─ No duplicate units per property
└─ profiles(email) ──────────── No duplicate emails

FOREIGN KEY Constraints:
├─ units_detailed.occupant_id ──► profiles.id (ON DELETE SET NULL)
├─ units_detailed.property_id ───► properties.id (ON DELETE CASCADE)
├─ tenant_verifications.tenant_id ─► profiles.id (ON DELETE CASCADE)
└─ profiles.unit_id ─────────────► units_detailed.id (ON DELETE SET NULL)

CHECK Constraints:
└─ units_detailed.status IN ('vacant', 'occupied', 'reserved', 'maintenance')
```

## 💾 Query Performance

```
Indexed Columns:
├─ units_detailed.property_id ──── Fast: Get units by property
├─ units_detailed.status ────────── Fast: Get vacant/occupied units
├─ units_detailed.occupant_id ───── Fast: Find unit by tenant
├─ profiles.unit_id ────────────── Fast: Get tenant's unit
├─ tenant_verifications.status ──── Fast: Get pending approvals
└─ tenant_verifications.property_id ─ Fast: Manager's pending tenants

Sample Query Performance:
└─ Get vacant units for property: < 50ms
└─ Get tenant with unit details: < 100ms
└─ Get pending verifications: < 100ms
```

---

This architecture ensures:
✅ Data consistency (one tenant per unit)
✅ Audit trails (all changes tracked)
✅ Performance (indexed queries)
✅ Security (RLS policies enforced)
✅ Scalability (normalized schema)
