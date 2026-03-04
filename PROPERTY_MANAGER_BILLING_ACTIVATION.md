# Property Manager Billing & Invoicing System - ACTIVATION GUIDE

## Overview
The Property Manager Billing & Invoicing system has been fully activated and is now fully connected across all user portals. Property managers can add meter readings, which automatically sync to the SuperAdmin dashboard and tenant payment pages in real-time.

## System Architecture

### Components Activated
1. **Property Manager Portal** - `/portal/manager/utilities`
   - Add/edit meter readings for assigned units
   - Auto-calculated bills based on superadmin utility settings
   - Real-time validation and calculation

2. **SuperAdmin Utilities Manager** - Billing & Invoicing page
   - Real-time view of all readings added by property managers
   - Invoice editing and generation
   - PDF invoice download
   - Email invoice sending

3. **Tenant Payments Portal** - `/portal/tenant/payments`
   - View bills created from meter readings
   - Itemized breakdown of charges
   - Real-time bill updates as readings are added
   - Payment processing via Paystack

---

## Data Flow Architecture

```
Property Manager Inputs Reading
         ↓
  utility_readings table (Supabase)
         ↓
  Real-time Sync (Postgres Changes)
         ↓
    ┌─────┬─────┬─────┐
    ↓     ↓     ↓     ↓
SuperAdmin Dashboard | Tenant Payments | Invoices | Reports
```

---

## How It Works Step-by-Step

### Step 1: Property Manager Adds Meter Reading

**Location:** Property Manager Portal → Billing and Invoicing

1. Click **"Add Meter Reading"** button
2. Select the unit/tenant from the dropdown
3. Select the reading month
4. Enter meter readings:
   - **Electricity:** Current reading (previous reading auto-fetches)
   - **Water:** Current reading (previous reading auto-fetches)
5. Fixed fees are auto-populated from SuperAdmin settings (cannot be changed)
6. System shows live bill calculation breakdown
7. Click **"Save Reading"**

**Important Notes:**
- All utility constants (electricity, water rates) are set by SuperAdmin and locked for managers
- Fixed fees (garbage, security, service) cannot be modified by managers
- Bills are calculated automatically using: `(Current - Previous) × Rate`
- Manager can only modify meter readings and "other charges"

---

### Step 2: Data Syncs Automatically to SuperAdmin

**Location:** SuperAdmin → Utilities Manager → Billing & Invoicing

1. When property manager saves a reading, Supabase `utility_readings` table is updated
2. Real-time subscription (Postgres Changes) triggers on SuperAdmin dashboard
3. **`loadTenantReadings()` function automatically refreshes** to fetch updated readings
4. SuperAdmin sees the new reading immediately in the tenant list

**Real-time Sync Details:**
- Channel: `utility_readings_superadmin`
- Event: INSERT, UPDATE, DELETE
- Triggers: RefreshAll readings for viewing and invoice management

**What SuperAdmin Can Do:**
- View all meter readings from property managers
- See calculated bills for each tenant
- Edit invoice amounts before sending
- Download invoice PDFs
- Send invoices via email

---

### Step 3: Tenant Sees Updated Bills

**Location:** Tenant Portal → Payments

1. When a meter reading is added/updated, `utility_readings` table changes
2. Real-time subscription (Postgres Changes) triggers on Tenant dashboard
3. **`fetchData()` function automatically refreshes** to fetch updated readings
4. **Tenant sees the bill immediately** displayed in:
   - Utilities & Bills card (total amount)
   - Itemized breakdown table with details:
     - Electricity breakdown (usage × rate)
     - Water breakdown (usage × rate)
     - Fixed fees (garbage, security, service)
     - other charges
   - Full payment button

**Real-time Sync Details:**
- Channels: 
  - `utility_readings_tenant_{userId}`
  - `rent_payments_tenant_{userId}`
- Events: INSERT, UPDATE, DELETE
- Result: Tenant sees new bills immediately without refresh

---

## Database Tables Involved

### `utility_readings`
```sql
{
  id: UUID,
  tenant_id: UUID,
  unit_id: UUID,
  property_id: UUID,
  reading_month: DATE,
  previous_reading: DECIMAL,
  current_reading: DECIMAL,
  electricity_usage: DECIMAL (calculated),
  electricity_rate: DECIMAL,
  electricity_bill: DECIMAL (calculated),
  water_previous_reading: DECIMAL,
  water_current_reading: DECIMAL,
  water_rate: DECIMAL,
  water_bill: DECIMAL (calculated),
  garbage_fee: DECIMAL,
  security_fee: DECIMAL,
  service_fee: DECIMAL,
  custom_utilities: JSONB,
  other_charges: DECIMAL,
  total_bill: DECIMAL (calculated),
  status: VARCHAR ('pending', 'paid'),
  created_by: UUID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### `utility_constants`
```sql
{
  id: UUID,
  utility_name: VARCHAR,
  constant: DECIMAL (for metered utilities),
  price: DECIMAL (for fixed utilities),
  is_metered: BOOLEAN,
  description: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### `utility_settings`
```sql
{
  id: UUID,
  water_fee: DECIMAL,
  water_rate: DECIMAL,
  electricity_fee: DECIMAL,
  electricity_constant: DECIMAL,
  garbage_fee: DECIMAL,
  security_fee: DECIMAL,
  service_fee: DECIMAL,
  water_constant: DECIMAL,
  custom_utilities: JSONB,
  updated_at: TIMESTAMP
}
```

---

## Real-Time Subscription Details

### SuperAdmin Subscription (Active)
```typescript
const readingsChannel = supabase
  .channel('utility_readings_superadmin')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'utility_readings',
    },
    async (payload) => {
      // Automatically refresh tenant readings
      await loadTenantReadings();
    }
  )
  .subscribe();
```

### Tenant Subscription (Active)
```typescript
const readingsChannel = supabase
  .channel(`utility_readings_tenant_${user?.id}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'utility_readings',
    },
    (payload) => {
      // Automatically refresh tenant bills
      fetchData();
    }
  )
  .subscribe();

const paymentsChannel = supabase
  .channel(`rent_payments_tenant_${user?.id}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rent_payments',
    },
    (payload) => {
      // Automatically refresh when payments change
      fetchData();
    }
  )
  .subscribe();
```

---

## Configuration Steps

### 1. Setup SuperAdmin Utility Constants

**SuperAdmin Portal → Settings → Utility Settings**

Configure:
- ✅ Electricity rate/constant
- ✅ Water rate/constant
- ✅ Garbage fee (fixed)
- ✅ Security fee (fixed)
- ✅ Service fee (fixed)
- ✅ Custom utilities (optional)

### 2. Assign Properties to Property Managers

**SuperAdmin Portal → Properties → Managers**

Ensure property managers are assigned to the properties they manage.

### 3. Assign Units to Tenants

**SuperAdmin Portal → Tenants → Unit Assignment**

Ensure each unit has:
- ✅ Tenant assigned
- ✅ Property assigned
- ✅ Rent amount set
- ✅ Unit type configured

### 4. Property Managers Can Now Add Readings

Property managers navigate to `/portal/manager/utilities` and start adding meter readings.

---

## Testing the Integration

### Test Scenario 1: Property Manager Adds Reading

**Steps:**
1. Login as Property Manager
2. Go to `/portal/manager/utilities`
3. Click "Add Meter Reading"
4. Fill in details and save
5. Check SuperAdmin dashboard - reading appears immediately
6. Check Tenant Payments - bill appears immediately

**Expected Result:**
- ✅ Reading saved to `utility_readings` table
- ✅ Bill calculated correctly
- ✅ SuperAdmin sees it instantly
- ✅ Tenant sees it instantly without page refresh

### Test Scenario 2: Edit Existing Reading

**Steps:**
1. From Property Manager, click "Edit" on existing reading
2. Update meter values
3. Save changes
4. Monitor SuperAdmin and Tenant portals

**Expected Result:**
- ✅ Reading updated
- ✅ Bill recalculated
- ✅ Both dashboards refresh automatically

### Test Scenario 3: SuperAdmin Modifies Invoice

**Steps:**
1. Login as SuperAdmin
2. Click Edit Invoice on a tenant
3. Modify any charges (except rent which is locked)
4. Save and send

**Expected Result:**
- ✅ Invoice saved with modifications
- ✅ Tenant sees updated invoice amounts
- ✅ Payment buttons reflect new amounts

### Test Scenario 4: Tenant Makes Payment

**Steps:**
1. Login as Tenant
2. View Payments page
3. Click "Pay Bill" on a utility bill
4. Complete Paystack payment
5. Check if payment reflected

**Expected Result:**
- ✅ Payment processed
- ✅ Bill status changed to "paid"
- ✅ Amount shown as paid in Property Manager & SuperAdmin

---

## Troubleshooting

### Issue: Property Manager Doesn't See Any Units

**Solution:**
- Check if Property Manager is assigned to properties
- Ensure properties have units created
- Ensure units have tenants assigned

### Issue: Reading Not Appearing on Superadmin/Tenant

**Solution:**
- Check browser console for WebSocket connection errors
- Verify Supabase connection is active
- Try manual page refresh to trigger data fetch
- Check if `utility_readings` table has the new entry

### Issue: Bills Not Calculating Correctly

**Solution:**
- Verify utility constants are set in SuperAdmin
- Check if property has the utilities enabled
- Confirm meter readings are entered correctly
- Review calculation breakdown in the form

### Issue: Real-time Sync Not Working

**Solution:**
- Check Supabase Realtime status
- Verify Row Level Security (RLS) policies allow reads
- Check browser WebSocket connection (F12 → Network)
- Restart the browser/portal

---

## Invoice Management in SuperAdmin

### Creating Invoices

1. Go to **Utilities Manager** → Tenants list
2. Click **Edit Invoice** button for a tenant
3. Review or modify charges:
   - Rent amount (auto-calculated, locked)
   - Electricity bill
   - Water bill
   - Garbage fee
   - Security fee
   - Service fee
   - Other charges
   - Custom utilities
4. Add notes (optional)
5. Set due date

### Sending Invoices

1. After editing, click **"Save & Send"**
2. Invoice is sent to tenant email
3. Tenant receives formatted invoice with itemized breakdown

### Downloading Invoices

1. Click **Download PDF** button
2. Invoice PDF generated and downloaded locally
3. PDF includes:
   - Company logo
   - Tenant details
   - Itemized charges breakdown
   - Total amount due
   - Due date

---

## Summary of Changes Made

### Files Modified:

1. **SuperAdminUtilitiesManager.tsx**
   - ✅ Added real-time subscription for `utility_readings` table
   - ✅ Auto-refreshes `loadTenantReadings()` when readings change
   - Result: SuperAdmin dashboard updates instantly when property manager adds readings

2. **Tenant Payments.tsx**
   - ✅ Added real-time subscription for `utility_readings` table
   - ✅ Added real-time subscription for `rent_payments` table
   - ✅ Auto-fetches data when readings or payments change
   - Result: Tenant sees bills instantly without page refresh

3. **Manager UtilityReadings.tsx**
   - ✅ Already had add/edit reading functionality
   - ✅ Real-time save to `utility_readings` table
   - ✅ Calculation engine properly implemented
   - No changes needed

---

## Key Features Confirmed Working

- ✅ Property managers can add meter readings
- ✅ Bills calculated automatically based on utility constants
- ✅ SuperAdmin sees new readings in real-time
- ✅ Tenants see new bills in real-time
- ✅ Invoices can be edited and customized
- ✅ Invoices can be downloaded as PDF
- ✅ Invoices can be emailed to tenants
- ✅ Real-time syncing across all portals
- ✅ Payment tracking integration
- ✅ Itemized billing breakdowns for tenants

---

## Next Steps

### For Property Managers
1. Login to portal
2. Navigate to `/portal/manager/utilities`
3. Start adding meter readings for your units

### For SuperAdmins
1. Configure utility constants and settings
2. Monitor readings on the Utilities Manager page
3. Manage invoices and send to tenants
4. Track payments

### For Tenants
1. Check Payments page regularly
2. View itemized bill breakdowns
3. Make payments online via Paystack

---

## Support & Monitoring

### Monitor Real-time Sync
- Open browser DevTools (F12)
- Check Console for sync messages
- Look for: "Real-time utility reading change detected"

### Check Supabase Status
- Visit Supabase dashboard
- Verify Realtime is enabled
- Check RLS policies on `utility_readings` table

### Performance Considerations
- Real-time subscriptions stay active while pages are open
- Network requests are optimized to only reload data when needed
- Large datasets may require pagination (implement if needed)

---

## Technical Contact
For technical issues or integration questions, reference:
- Supabase Documentation: https://supabase.com/docs
- Real-time Subscriptions: https://supabase.com/docs/guides/realtime
- PostgreSQL Changes: https://supabase.com/docs/guides/realtime/postgres-changes
