# VISUAL FLOW REFERENCE

## 🔄 Complete Registration & Approval Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: REGISTRATION                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────────────┐
│   Tenant     │         │  Property Manager    │
│   Registers  │         │   Registers          │
└──────┬───────┘         └──────────┬───────────┘
       │                            │
       │ Fills form:                │ Fills form:
       │ • Email                    │ • Email
       │ • Password                 │ • Password
       │ • Name                     │ • Name
       │ • Phone                    │ • Phone
       │ • Property                 │ • Properties (multiple)
       │ • Unit                     │
       │                            │
       └────────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ supabase.auth.signUp │
         │   Sends metadata:    │
         │   role: 'tenant'     │   OR   │   role: 'property_manager'
         │   status: 'pending'  │        │   status: 'pending'
         └──────────┬───────────┘
                    │
                    ▼
       ┌────────────────────────────┐
       │  Auth.users row created    │
       │  Trigger fires: INSERT     │
       │  on auth.users             │
       └──────────────┬─────────────┘
                      │
                      ▼
       ┌──────────────────────────────┐
       │  handle_new_user() Function  │
       │  SECURITY DEFINER            │
       │  Bypasses RLS              │
       └──────────────┬───────────────┘
                      │
         ┌────────────┴─────────────┐
         │                          │
         ▼                          ▼
  ┌─────────────┐          ┌──────────────┐
  │   Profiles  │          │  Profiles    │
  │   Created:  │          │  Created:    │
  │ role:tenant │          │ role: mgr    │
  │ status:pend │          │ status: pend │
  │ is_active:F │          │ is_active: F │
  └──────┬──────┘          └───────┬──────┘
         │                         │
         ▼                         ▼
  ┌────────────────┐      ┌─────────────────┐
  │ approval_       │      │  approval_      │
  │ requests       │      │  requests       │
  │ created        │      │  created        │
  │ type: tenant_  │      │  type: manager_ │
  │    verify      │      │      assign     │
  └────────────────┘      └─────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              PHASE 2: SUPER ADMIN APPROVAL                      │
└─────────────────────────────────────────────────────────────────┘

                    AdminDashboard
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
   ┌───────────────┐          ┌──────────────────┐
   │  Approvals    │          │   All Users      │
   │  Tab:         │          │   Tab:           │
   │              │          │                  │
   │ Pending:     │          │ Shows all        │
   │ Property Mgrs│          │ profiles with    │
   │              │          │ role & status    │
   └────────┬─────┘          └──────────────────┘
            │
            ▼
     ┌────────────────┐
     │ Admin sees:    │
     │ "Jane Smith    │
     │  Property Mgr  │
     │  Pending"      │
     └────────┬───────┘
              │
              ▼
        ┌──────────────┐
        │ Clicks:      │
        │ "Approve     │
        │  Access"     │
        └────────┬─────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ UPDATE profiles     │
        │ SET status='active',│
        │ is_active=true      │
        │ WHERE id=jane_id    │
        └────────┬────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   [TENANT]          [MANAGER]
   Tenant can        Admin sees new button:
   now login         "Assign Properties"
                            │
                            ▼
                    ┌─────────────────────┐
                    │ Dialog opens with   │
                    │ property list:      │
                    │                     │
                    │ ☐ Downtown Plaza    │
                    │ ☑ Westside Apts     │
                    │ ☑ Suburban Villas   │
                    │                     │
                    │ "Assign 2 Props"    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ manager_assignments │
                    │ entries created:    │
                    │                     │
                    │ manager_id: jane    │
                    │ property_id: west   │
                    │ status: active      │
                    │                     │
                    │ manager_id: jane    │
                    │ property_id: subur  │
                    │ status: active      │
                    └──────────┬──────────┘
                               │
                               ▼
                    Manager can now login


┌─────────────────────────────────────────────────────────────────┐
│              PHASE 3: MANAGER PORTAL APPROVAL                   │
└─────────────────────────────────────────────────────────────────┘

            Manager Login
                 │
                 ▼
        ┌────────────────────┐
        │ PortalRedirect     │
        │ Checks role        │
        │ property_manager   │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ /portal/manager    │
        │ ManagerPortal.tsx  │
        └────────┬───────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
 ┌────────────┐       ┌──────────────────┐
 │ Properties │       │ Pending Tenants  │
 │ Tab        │       │ Tab              │
 │            │       │                  │
 │ • Westside │       │ John Doe        │
 │   Apts     │       │ Applied: 2/3/26 │
 │ • Suburban │       │ Unit 101        │
 │   Villas   │       │ Westside Apts   │
 └────────────┘       │                  │
                      │ [Reject] [Approve]
                      └────────┬─────────┘
                               │
                               ▼
                      Manager clicks "Approve"
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
         ┌────────────────────┐  ┌────────────────────┐
         │ tenant_verifications│  │ profiles UPDATE    │
         │ UPDATE             │  │ WHERE id=john_id   │
         │ status='verified'  │  │ SET status='active'│
         │ verified_by=jane_id│  │ is_active=true     │
         └────────┬───────────┘  └────────┬───────────┘
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
                        ✅ APPROVED
                    Tenant can now login


┌─────────────────────────────────────────────────────────────────┐
│                   FINAL STATES                                  │
└─────────────────────────────────────────────────────────────────┘

Tenant Journey:
  Signup → Pending → [Admin Approval] → Active (in system)
         → [Manager Approval] → Verified → Can Login ✅

Manager Journey:
  Signup → Pending → [Admin Approval] → Active (in system)
         → [Properties Assigned] → Can Login ✅
         → Approves Tenants → Tenants can Login ✅
```

---

## 🗂️ Database Schema Visualization

```
┌─────────────────────────────────────┐
│         auth.users                  │
│         (Supabase)                  │
├─────────────────────────────────────┤
│ id: UUID                            │
│ email: TEXT                         │
│ raw_user_meta_data: JSONB           │
│   ├─ role: 'tenant' | 'mgr'         │
│   ├─ status: 'pending' | 'active'   │
│   ├─ first_name                     │
│   ├─ last_name                      │
│   └─ phone                          │
└──────────────┬──────────────────────┘
               │
               │ FK(id)
               │
               ▼
┌─────────────────────────────────────┐
│         profiles                    │
├─────────────────────────────────────┤
│ id: UUID ◄─── Copied from auth.users
│ email: TEXT                         │
│ first_name: TEXT                    │
│ last_name: TEXT                     │
│ role: 'tenant'|'property_manager'..│
│ status: 'active'|'pending'|...      │
│ is_active: BOOLEAN                  │
│ created_at: TIMESTAMP               │
│ updated_at: TIMESTAMP               │
└──────┬──────────────────────────────┘
       │
       ├─────────────────────┬──────────────────┐
       │                     │                  │
       ▼                     ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ approval_        │  │ manager_         │  │ tenant_          │
│ requests         │  │ assignments      │  │ verifications    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id: UUID         │  │ id: UUID         │  │ id: UUID         │
│ submitted_by: FK │  │ manager_id: FK   │  │ tenant_id: FK    │
│   (to profiles)  │  │   (to profiles)  │  │   (to profiles)  │
│ type: TEXT       │  │ property_id: FK  │  │ property_id: FK  │
│ status: TEXT     │  │   (to properties)│  │   (to properties)│
│ created_at       │  │ status: TEXT     │  │ unit_id: FK      │
│ updated_at       │  │ created_at       │  │   (to units)     │
└──────────────────┘  │ updated_at       │  │ status: TEXT     │
                      └──────────────────┘  │ verified_by: FK  │
                                            │ verified_at      │
                                            └──────────────────┘

┌──────────────────────────────────────┐
│         properties                   │
├──────────────────────────────────────┤
│ id: UUID                             │
│ name: TEXT                           │
│ address: TEXT                        │
│ property_manager_id: FK              │
│   (optional - old field)             │
│ total_units: INT                     │
│ occupied_units: INT                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         units_detailed               │
├──────────────────────────────────────┤
│ id: UUID                             │
│ property_id: FK                      │
│ unit_number: TEXT                    │
│ status: 'vacant'|'occupied'|'reserved'
│ occupant_id: FK (to profiles)        │
│ price_monthly: NUMERIC               │
└──────────────────────────────────────┘
```

---

## 🔐 RLS (Row Level Security) Flow

```
User tries to INSERT into profiles
         │
         ▼
    RLS Check 1:
    Is auth.role() = 'service_role'?
         │
    ┌────┴────┐
    │          │
   YES         NO
    │          │
    ▼          ▼
 ALLOW    Check User Role
         │
    ┌────┴─────────────────┬──────────────┐
    │                      │              │
   Inserting        Selecting own     Updating own
  own profile       profile?          profile?
    │               │                 │
    ▼               ▼                 ▼
  ALLOW          ALLOW              ALLOW
(if user_id =  (if auth.uid() = (if auth.uid() =
 auth.uid())    record.id)         record.id)
    │               │                 │
    └───────────────┴─────────────────┘
                    │
                    ▼
              Operation allowed ✅
```

---

## 📊 Request/Response Sequence

```
USER REGISTRATION
───────────────────────────────────────────────────────

1. User → Browser: Fill signup form
   
2. Browser → Supabase Auth: 
   POST /auth/v1/signup
   {
     "email": "john@example.com",
     "password": "secure123",
     "data": {
       "role": "tenant",
       "status": "pending",
       "first_name": "John",
       "last_name": "Doe"
     }
   }

3. Supabase Auth → Database:
   INSERT INTO auth.users
   CREATE NEW USER ID: abc123

4. Supabase Database → Trigger:
   AFTER INSERT on auth.users
   Call: handle_new_user()

5. Trigger → Database:
   INSERT INTO profiles (
     id: abc123,
     role: 'tenant',
     status: 'pending',
     ...
   )

6. Trigger → Browser:
   Returns auth.users entry

7. Browser → Frontend:
   User sees: "Awaiting property manager approval"

8. Frontend → Database:
   INSERT INTO approval_requests
   INSERT INTO notifications

9. Database → Browser:
   Approval request created ✅


SUPER ADMIN APPROVAL
───────────────────────────────────────────────────────

1. Admin → AdminDashboard:
   GET /admin
   Fetches all profiles with status='pending'

2. AdminDashboard → Database:
   SELECT * FROM profiles
   WHERE role='property_manager' AND status='pending'

3. Database → AdminDashboard:
   Returns list of pending managers

4. Admin (clicks): "Approve Access"

5. AdminDashboard → Database:
   UPDATE profiles
   SET status='active', is_active=true
   WHERE id=xyz

6. Database:
   Profiles row updated

7. AdminDashboard → Admin:
   Toast: "Manager approved"

8. Admin (clicks): "Assign Properties"

9. PropertyManagerAssignment Dialog → Database:
   SELECT * FROM properties WHERE status='active'

10. Database → Dialog:
    Returns property list

11. Admin → Dialog:
    Selects: Westside, Suburban

12. Admin (clicks): "Assign 2 Properties"

13. Dialog → Database:
    INSERT INTO manager_assignments (2 rows)

14. Database:
    Assignments created ✅


MANAGER PORTAL ACCESS
───────────────────────────────────────────────────────

1. Manager → ManagerPortal:
   GET /portal/manager
   Auth header: Bearer jwt_token

2. ManagerPortal → Database:
   SELECT * FROM manager_assignments
   WHERE manager_id='xyz' AND status='active'

3. Database → ManagerPortal:
   Returns: [westside_id, suburban_id]

4. ManagerPortal → Database:
   SELECT * FROM properties
   WHERE id IN (westside_id, suburban_id)

5. Database → ManagerPortal:
   Returns: Property details

6. ManagerPortal → Database:
   SELECT * FROM tenant_verifications
   WHERE property_id IN (...)
   AND status='pending'

7. Database → ManagerPortal:
   Returns: Pending tenants

8. ManagerPortal → Manager:
   Renders:
   - My Properties tab: [Westside, Suburban]
   - Pending Tenants tab: [John Doe application]

9. Manager (clicks): "Approve"

10. ManagerPortal → Database:
    BEGIN TRANSACTION
      UPDATE tenant_verifications
      SET status='verified'
      
      UPDATE profiles (tenant)
      SET status='active'
    COMMIT

11. Database:
    Both updates complete

12. ManagerPortal → Manager:
    Toast: "Tenant approved"

13. John Doe (tries login):
    Can now access system ✅
```

---

## 🎯 Key Decision Points

```
                    User Signup
                         │
                    ┌────┴────┐
                    │          │
                  TENANT    MANAGER
                    │          │
                    ▼          ▼
              role: 'tenant'  role: 'property_manager'
              status: 'pending' status: 'pending'
                    │          │
                    ▼          ▼
              AUTO CREATED   AUTO CREATED
              by trigger     by trigger
                    │          │
                    ▼          ▼
            approval_request  approval_request
            type:             type:
            tenant_verify     manager_assign
                    │          │
                    ▼          ▼
                  ADMIN      ADMIN (Part 1)
                 APPROVES   APPROVES ACCESS
                    │          │
                    ▼          ▼
            status: active  status: active
            CANNOT LOGIN    CANNOT LOGIN YET
            (needs manager           │
             approval)               ▼
                    │          ADMIN (Part 2)
                    │          ASSIGNS PROPERTIES
                    │          ├─ Property 1
                    │          ├─ Property 2
                    │          └─ Property 3
                    │               │
                    ▼               ▼
              MANAGER PORTAL   CAN LOGIN
              sees tenant           │
                    │               ▼
                    │          MANAGER PORTAL
                    │               │
                    ▼               ▼
              MANAGER             │
              APPROVES            │
                    │              │
                    └──────┬───────┘
                           │
                           ▼
                    ✅ BOTH CAN LOGIN
                    ✅ SYSTEM READY
```

This visual reference shows how all the pieces fit together! 🎉
