# 👔 Manager Dashboard - Tenant & Property Allocation Guide

## Overview

This guide shows how managers use the Ayden Real Estate Platform to manage properties and allocate tenants to buildings.

---

## What Managers Can Do

### 1. **View Properties**
Managers can see all properties they manage with complete details.

```
Dashboard → Properties
├── Ayden Homes
│   ├── Location: 123 Nairobi Avenue
│   ├── Units: 3
│   ├── Occupied: 3/3 (100%)
│   └── Monthly Revenue: KES 110,000
├── Palm Plaza
│   ├── Location: 456 Mombasa Road
│   ├── Units: 5
│   ├── Occupied: 4/5 (80%)
│   └── Monthly Revenue: KES 180,000
└── Cedar Heights
    ├── Location: 789 Kisumu Lane
    ├── Units: 8
    ├── Occupied: 6/8 (75%)
    └── Monthly Revenue: KES 240,000
```

---

### 2. **Allocate Tenants to Properties**
Managers assign tenants to specific units and leases.

#### How to Allocate a Tenant:

1. **Go to**: Manager Dashboard → Tenants
2. **Click**: "Add Tenant" or "Allocate New Tenant"
3. **Fill in**:
   - Tenant Name / Email
   - Select Property
   - Select Unit
   - Set Monthly Rent (in KES)
   - Set Security Deposit
   - Set Move-in Date
   - Set Lease Duration
4. **Click**: "Save"

---

## Current Test Setup

### Property: Ayden Homes
```
Property Information:
├── Name: Ayden Homes
├── Address: 123 Nairobi Avenue, Nairobi
├── Status: Active
├── Total Units: 3
├── Manager: (Your Manager Account)
└── Monthly Revenue: KES 110,000

Units and Allocations:
├── Unit A-101
│   ├── Status: Occupied
│   ├── Tenant: tenant1@test.com
│   ├── Lease Status: Active
│   └── Monthly Rent: KES 35,000
│
├── Unit A-102
│   ├── Status: Occupied
│   ├── Tenant: tenant2@test.com
│   ├── Lease Status: Active
│   └── Monthly Rent: KES 40,000
│
└── Unit A-103
    ├── Status: Occupied
    ├── Tenant: tenant3@test.com
    ├── Lease Status: Active
    └── Monthly Rent: KES 35,000
```

---

## Manager Dashboard Features

### 📊 Dashboard Overview
```
Manager Dashboard
├── Quick Stats
│   ├── Total Properties: 1 (Ayden Homes setup)
│   ├── Total Units: 3
│   ├── Occupied Units: 3/3 (100%)
│   └── Monthly Revenue: KES 110,000
│
├── Property Performance
│   ├── Unit Occupancy: 100%
│   ├── Average Rent: KES 36,667/unit
│   └── Year-to-Date Revenue: KES 1,320,000 (projected)
│
└── Recent Activities
    ├── New Lease: tenant1@test.com → Unit A-101
    ├── Payment Received: KES 35,000 (tenant2)
    └── Maintenance Request: Leaking Faucet (tenant1)
```

### 👥 Tenants Management
```
Tenants Page
├── Total Tenants: 3 (in Ayden Homes)
├── Active: 3
├── Inactive: 0
│
└── Tenant List:
    ├── tenant1@test.com
    │   ├── Property: Ayden Homes
    │   ├── Unit: A-101
    │   ├── Status: Active
    │   ├── Monthly Rent: KES 35,000
    │   ├── Lease Expiry: 2025-01-30
    │   ├── Actions: [View] [Edit] [Terminate]
    │   └── Recent Activity: Last payment 2025-01-30
    │
    ├── tenant2@test.com
    │   ├── Property: Ayden Homes
    │   ├── Unit: A-102
    │   ├── Status: Active
    │   ├── Monthly Rent: KES 40,000
    │   ├── Lease Expiry: 2025-01-30
    │   ├── Actions: [View] [Edit] [Terminate]
    │   └── Recent Activity: Last payment 2025-01-30
    │
    └── tenant3@test.com
        ├── Property: Ayden Homes
        ├── Unit: A-103
        ├── Status: Active
        ├── Monthly Rent: KES 35,000
        ├── Lease Expiry: 2025-01-30
        ├── Actions: [View] [Edit] [Terminate]
        └── Recent Activity: Last payment 2025-01-30
```

### 💰 Payments Management
```
Payments Page
├── Filter by Property: [Ayden Homes ▼]
│
├── Payment Summary
│   ├── Total Collected: KES 110,000
│   ├── Pending: KES 0
│   ├── Overdue: KES 0
│   └── Collection Rate: 100%
│
└── Payment Records:
    ├── tenant1@test.com - KES 35,000
    │   ├── Date: 2025-01-30
    │   ├── Status: Paid ✓
    │   ├── Method: M-Pesa
    │   └── Reference: REF-20250130...
    │
    ├── tenant2@test.com - KES 40,000
    │   ├── Date: 2025-01-30
    │   ├── Status: Paid ✓
    │   ├── Method: M-Pesa
    │   └── Reference: REF-20250130...
    │
    └── tenant3@test.com - KES 35,000
        ├── Date: 2025-01-30
        ├── Status: Paid ✓
        ├── Method: M-Pesa
        └── Reference: REF-20250130...
```

### 🔧 Maintenance Management
```
Maintenance Page
├── Filter by Property: [Ayden Homes ▼]
│
├── Status Summary
│   ├── Pending: 1
│   ├── In Progress: 1
│   ├── Completed: 1
│   └── Total: 3
│
└── Maintenance Requests:
    ├── [PENDING] Leaking Faucet
    │   ├── Unit: A-101
    │   ├── Tenant: tenant1@test.com
    │   ├── Priority: High
    │   ├── Requested: 2025-01-25
    │   ├── Assigned To: (Unassigned)
    │   └── Actions: [Assign] [View] [Update]
    │
    ├── [IN PROGRESS] Broken Window
    │   ├── Unit: A-102
    │   ├── Tenant: tenant2@test.com
    │   ├── Priority: Urgent
    │   ├── Requested: 2025-01-25
    │   ├── Assigned To: Contractor John
    │   └── Actions: [Update] [View] [Mark Complete]
    │
    └── [COMPLETED] Paint Touch-up
        ├── Unit: A-103
        ├── Tenant: tenant3@test.com
        ├── Priority: Medium
        ├── Requested: 2025-01-25
        ├── Completed: 2025-01-30
        └── Actions: [View]
```

---

## How to Test Manager Functionality

### Step 1: Create Manager Account

In Supabase Auth, create:
```
Email: manager@aydenrealty.com
Password: Manager123!@
Role: manager
```

### Step 2: Link Manager to Property

In Supabase, the manager should be linked to Ayden Homes:
```sql
UPDATE properties
SET manager_id = (SELECT id FROM auth.users WHERE email = 'manager@aydenrealty.com')
WHERE name = 'Ayden Homes';
```

### Step 3: Login as Manager

1. Open app
2. Click "Sign In"
3. Email: manager@aydenrealty.com
4. Password: Manager123!@
5. You're taken to Manager Dashboard

### Step 4: Verify Manager Can See

- ✅ Ayden Homes property
- ✅ All 3 tenants (tenant1, tenant2, tenant3)
- ✅ All units (A-101, A-102, A-103)
- ✅ All payments (KES amounts)
- ✅ All maintenance requests

---

## Creating New Tenants in Manager Dashboard

### To Add tenant4 to Ayden Homes:

1. **Manager Dashboard** → **Tenants**
2. Click **"Add New Tenant"**
3. **Fill Form**:
   ```
   Email: tenant4@test.com
   First Name: John
   Last Name: Doe
   
   Property: Ayden Homes [▼]
   Unit: (Need new unit - e.g., A-104)
   Monthly Rent: KES 35,000
   Security Deposit: KES 70,000
   Move-in Date: 2025-01-30
   Lease Duration: 12 months
   ```
4. Click **"Allocate Tenant"**

---

## Testing Workflow

### Test Case 1: Allocate New Tenant
```
Scenario: Manager allocates a new tenant to Ayden Homes

Steps:
1. Login as manager@aydenrealty.com
2. Go to Tenants → Add New Tenant
3. Fill in tenant4@test.com details
4. Assign to Unit A-104, KES 35,000/month
5. Save

Expected Result:
✓ New tenant appears in Ayden Homes
✓ Unit A-104 marked as occupied
✓ Monthly revenue updated to KES 145,000
✓ Tenant can login and see Ayden Homes in header
```

### Test Case 2: View Property Performance
```
Scenario: Manager views Ayden Homes performance

Steps:
1. Login as manager@aydenrealty.com
2. Go to Dashboard
3. Click Ayden Homes property card
4. View property details

Expected Result:
✓ Property info displays (location, units, etc.)
✓ All 3 tenants visible
✓ Unit occupancy shown (3/3)
✓ Monthly revenue: KES 110,000
✓ All amounts in KES currency
```

### Test Case 3: Process Payment
```
Scenario: Manager processes a payment

Steps:
1. Login as manager@aydenrealty.com
2. Go to Payments
3. Filter by Ayden Homes
4. See all 3 tenant payments

Expected Result:
✓ All payments show in KES
✓ Status visible (Paid/Pending/Overdue)
✓ Payment method visible (M-Pesa)
✓ Payment history available
```

---

## Multi-Property Management

### With Ayden Homes Setup Complete

Managers can now:

1. **Add More Properties**
   ```
   Example: Palm Plaza
   - 5 units
   - 4 tenants allocated
   - KES 180,000 monthly revenue
   ```

2. **Allocate Tenants Across Properties**
   ```
   Tenant can be assigned to:
   - Ayden Homes → Unit A-101
   OR
   - Palm Plaza → Unit B-201
   OR
   - Cedar Heights → Unit C-301
   ```

3. **View All Properties Dashboard**
   ```
   Dashboard shows:
   ├── Ayden Homes: 100% occupied (KES 110,000)
   ├── Palm Plaza: 80% occupied (KES 180,000)
   └── Cedar Heights: 75% occupied (KES 240,000)
   
   Total Monthly Revenue: KES 530,000
   ```

---

## Currency in Manager Dashboard

All financial data shows in **KES (Kenyan Shillings)**:

- Monthly Rent: **KES 35,000**
- Security Deposit: **KES 70,000**
- Payment Amount: **KES 35,000**
- Monthly Revenue: **KES 110,000**
- Tenant Balance: **KES 5,000**

---

## Summary

✅ **Ayden Homes** is now set up with:
- 3 test tenants allocated
- 3 units occupied
- Complete payment history
- Sample maintenance requests
- Manager can view all data
- All currency in KES

✅ **Manager Dashboard** enables:
- Property management
- Tenant allocation
- Payment tracking
- Maintenance oversight
- Financial reporting

✅ **Test Environment Ready** for:
- Multi-tenant functionality
- Manager operations
- Payment processing
- Maintenance workflows

---

## Next: Super Admin Setup

The Super Admin dashboard should have the ability to:
1. Create new properties
2. Assign managers to properties
3. View all properties across the system
4. Monitor all tenants and payments
5. System-wide financial reporting

See: **SUPER_ADMIN_SETUP_GUIDE.md**

---

**Status**: ✅ Manager Dashboard ready for Ayden Homes testing

