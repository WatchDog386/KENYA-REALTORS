# Fixed Utility Pricing - Complete Implementation & Testing Guide

## What Was Implemented

### 1. **SuperAdmin Utilities Manager** - Fixed Utility Pricing
   - Added `price` column to store fixed fees
   - Updated UI table with separate "Multiplier" and "Fixed Price (KES)" columns
   - Fixed utilities (Garbage, Security, Service) show editable price fields
   - Metered utilities (Electricity, Water) show "N/A (Metered)" in price column
   - All changes are debounced (800ms) and show "saving..." indicator

### 2. **Property Manager - Utility Readings**
   - Integration of fixed utility prices when recording readings
   - Bill calculation now pulls prices from `utility_constants` table
   - Fixed fees are applied at a flat rate (multiplied by 1)
   - Bill breakdown shows the exact prices being used

### 3. **Data Persistence**
   - Added cleanup function to clear pending timeouts on page unmount
   - Fixed data is fetched fresh on page load
   - Changes persist in database (no more disappearing on reload)

---

## Setup Steps

### Step 1: Update Database Schema
Run this SQL in Supabase Dashboard:
```sql
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
```

### Step 2: Set Default Prices
Run this SQL to set initial prices (adjust values as needed):
```sql
UPDATE public.utility_constants SET price = 500 WHERE utility_name = 'Garbage';
UPDATE public.utility_constants SET price = 1000 WHERE utility_name = 'Security';
UPDATE public.utility_constants SET price = 500 WHERE utility_name = 'Service';
```

### Step 3: Verify RLS Policies
Run [database/FIX_UTILITY_CONSTANTS_RLS.sql](database/FIX_UTILITY_CONSTANTS_RLS.sql) if you haven't already.

---

## Testing Workflow

### Test 1: Verify Utilities Show in SuperAdmin Dashboard
1. Navigate to **Utilities** > **Manage Utility Constants**
2. Confirm all 5 utilities display:
   - Electricity (Metered, Multiplier=1, Price=N/A)
   - Water (Metered, Multiplier=1, Price=N/A)
   - Garbage (Fixed, Multiplier=1, Price=500)
   - Security (Fixed, Multiplier=1, Price=1000)
   - Service (Fixed, Multiplier=1, Price=500)

### Test 2: Edit a Fixed Utility Price
1. Click on the Garbage "Fixed Price (KES)" field
2. Change value from 500 to 750
3. Wait 1 second - should see "saving..." text in green
4. Confirm green highlight appears briefly
5. See success toast: "Price updated successfully"
6. **Reload the page** - Verify the value is still 750 (not reverted to 500)

### Test 3: Edit a Metered Utility Multiplier
1. Click on the Electricity "Multiplier" field
2. Change value from 1 to 140 (or any number)
3. Wait 1 second - should see "saving..." text in blue
4. See success toast: "Constant updated successfully"
5. **Reload the page** - Verify the value persists

### Test 4: Add a Custom Fixed Utility
1. Click "Add Utility" button
2. Fill in:
   - Name: "WIFI"
   - Type: Unchecked (Fixed)
   - Constant: 1
   - Fixed Price: 200
3. Click "Add Utility"
4. Verify it appears in the table

### Test 5: Verify in Property Manager - Tenant Readings
1. Navigate to **Manager Dashboard** > **Utilities** > **Tenant Readings**
2. Select a property and unit
3. Record a reading:
   - Electricity: current=150, previous=100 (50 unit usage)
   - Water: current=80, previous=70 (10 unit usage)
4. View the bill breakdown
5. Verify calculations:
   - Electricity: 50 units × 140 (constant) = 7,000 KES
   - Water: 10 units × 1 (constant) = 10 KES
   - Garbage: 750 KES (flat - from your edited value)
   - Security: 1,000 KES (flat)
   - Service: 500 KES (flat)
   - **Total: ~9,260 KES**

### Test 6: Change Fixed Price and See Bill Update
1. Go back to **Utilities** > **Manage Utility Constants**
2. Edit Garbage price from 750 to 300
3. Wait for save to complete
4. Go back to **Tenant Readings**
5. Add a new reading for a different tenant
6. Verify Garbage now shows 300 KES (not 750)
7. Verify total bill reflected the new price

---

## Key Files Modified

1. **SuperAdminUtilitiesManager.tsx**
   - Added `updatingField` state to track which field is updating
   - Added `handleUpdatePrice` function for fixed utility prices
   - Updated UI table with price column and validation

2. **UtilityReadings.tsx**
   - Updated `UtilityConstant` interface to include `price`
   - Updated `calculateBills` function to pull prices from utility_constants
   - Updated bill breakdown display to use calculated prices

3. **Database**
   - [20260227_add_fixed_utility_prices.sql](20260227_add_fixed_utility_prices.sql)
   - [COMPLETE_FIXED_UTILITY_SETUP.sql](COMPLETE_FIXED_UTILITY_SETUP.sql)
   - [FIX_UTILITY_CONSTANTS_RLS.sql](FIX_UTILITY_CONSTANTS_RLS.sql)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Changes disappear on reload | Clear browser cache, verify RLS policies with COMPLETE_FIXED_UTILITY_SETUP.sql |
| "Failed to update price" error | Check RLS policies, verify user is superadmin role |
| Fixed price field not saving | Check browser console for errors, wait 800ms for debounce |
| Bill still using old prices | Refresh Property Manager page to fetch latest utility_constants |
| Can't edit price for metered utilities | Normal behavior - checkbox prevents editing metered utility prices |

---

## Notes

- **Multiplier** is for metered utilities (Electricity, Water) - units × multiplier = cost
- **Fixed Price** is for non-metered utilities (Garbage, Security, Service) - flat fee regardless of usage
- Changes are debounced 800ms to prevent excessive database hits
- All RLS policies require user to be superadmin role
- Everyone can view utility constants, but only superadmin can edit/delete
