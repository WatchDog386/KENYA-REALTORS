# Utility Pricing System - Quick Start Guide

## 🎯 What You Just Set Up

A complete utility billing system where:
- **SuperAdmin** sets and manages pricing constants
- **Property Managers** use these constants to calculate tenant bills from meter readings
- **Tenants** pay based on their usage and fixed fees

---

## 📊 How It Works

### Step 1: SuperAdmin Sets Constants

Go to **Utility Management Dashboard** → **Manage Utility Constants**

**Example Setup:**
```
Electricity:
  Constant: 50 (KES per unit used)
  Type: Metered
  
Water:
  Constant: 30 (KES per unit used)
  Type: Metered
  
Garbage:
  Constant: 500 (Fixed fee)
  Type: Fixed
  
Security:
  Constant: 1000 (Fixed fee)
  Type: Fixed
  
Custom: WIFI
  Constant: 700 (Fixed fee)
  Type: Fixed
```

### Step 2: Property Manager Enters Readings

Go to **Utility Management** → **Add Meter Reading**

1. Select Unit and Tenant
2. Enter readings:
   - Electricity Previous: 100
   - Electricity Current: 150
   - Water Previous: 200
   - Water Current: 210
3. Formula guide shows how bills are calculated
4. Click Save → Bill auto-calculated

### Step 3: Bills Calculated Automatically

```
Electricity: (150 - 100) × 50 = 2,500 KES
Water: (210 - 200) × 30 = 300 KES
Garbage: 500 KES (fixed)
Security: 1,000 KES (fixed)
WIFI: 700 KES (fixed)
─────────────────────────
Total: 5,000 KES
```

---

## 🔧 Constants Explained

### Metered Utilities (Usage-Based)
- **Electricity** and **Water**
- Formula: `(Current - Previous) × Constant = Bill`
- The constant is what you multiply by the units used
- Change the constant → All future bills use the new rate

### Fixed Utilities (Flat Fees)
- **Garbage, Security, Service, Custom utilities**
- Formula: `Fixed Fee`
- Not based on usage
- Same amount every month

---

## 📋 Adding Custom Utilities

As SuperAdmin:

1. Go to **Utility Management** → **Manage Utility Constants**
2. Click **Add Utility**
3. For **WIFI** (let's say):
   ```
   Name: WIFI
   Constant: 700
   Type: Fixed (if same every month)
   or Metered (if usage-based)
   ```
4. Click **Add Utility**
5. Available to all Property Managers immediately

---

## 🎨 The System Architecture

```
┌─────────────────────────────────────┐
│      SuperAdmin Dashboard           │
│  (Set Constants & Base Prices)      │
├─────────────────────────────────────┤
│  • Water Constant: 1.0              │
│  • Electricity Constant: 1.0        │
│  • Add Custom Utilities             │
│  • Set Fixed Fees (prices)          │
└──────────────┬──────────────────────┘
               │ Stores in:
               │ - utility_constants
               │ - utility_settings
               ▼
┌─────────────────────────────────────┐
│    Property Manager Dashboard       │
│  (Calculate Bills from Readings)    │
├─────────────────────────────────────┤
│  • Enter Meter Readings             │
│  • Rates Prefilled from SuperAdmin  │
│  • Bill Auto-Calculated             │
│  • Formula Guide Displayed          │
└──────────────┬──────────────────────┘
               │ Creates:
               │ - utility_readings
               │ - payments (via trigger)
               ▼
┌─────────────────────────────────────┐
│      Tenant Dashboard               │
│  (View & Pay Bills)                 │
├─────────────────────────────────────┤
│  • See Bill Breakdown               │
│  • Pay via Paystack                 │
│  • View History                     │
└─────────────────────────────────────┘
```

---

## 🚀 Key Features

✅ **Prefilled Forms** - Property managers don't re-enter constants every time

✅ **Calculation Guide** - Shows exactly how each utility is calculated

✅ **Dynamic Utilities** - Add new utilities without code changes

✅ **Metered & Fixed** - Support both usage-based and flat-fee utilities

✅ **Real-time Updates** - Change a constant → New bills use new constant

✅ **Separation of Concerns** - SuperAdmin sets rules, managers apply them

---

## 💡 Example Scenarios

### Scenario 1: Electricity Rate Increase
- **Old**: Constant = 50 per unit
- SuperAdmin changes: Constant = 55 per unit
- **Result**: All NEW bills from this month onwards use 55
- **Old bills**: Remain unchanged (55 × usage)

### Scenario 2: Add Parking Fee
- SuperAdmin adds: "Parking" utility, constant = 1,000, type = Fixed
- Property managers can now select it when creating bills
- All tenants with parking = +1,000 KES to their bill

### Scenario 3: Usage-Based Parking
- SuperAdmin adds: "Parking Slots" utility, constant = 200, type = Metered
- Property manager enters: 2 slots (current) vs 1 slot (previous)
- Bill: (2 - 1) × 200 = 200 KES for 1 additional slot

---

## 📌 Important Reminders

1. **Constants are multipliers** - The number you set gets multiplied by usage (for metered)
2. **Property managers can't change constants** - That's SuperAdmin only
3. **Prefilled doesn't mean locked** - Managers can adjust if needed for special cases
4. **All tenants get same formula** - Ensures consistency across the platform
5. **Changing constants is immediate** - Affects all future bills created after the change

---

## 🔐 Permissions

| Action | SuperAdmin | Manager | Tenant |
|--------|-----------|---------|--------|
| View Constants | ✅ | ✅ | ❌ |
| Change Constants | ✅ | ❌ | ❌ |
| Add Utilities | ✅ | ❌ | ❌ |
| Enter Readings | ✅ | ✅ | ❌ |
| View Bills | ✅ | ✅ | ✅ |
| Pay Bills | ✅ | ❌ | ✅ |

---

## 📞 Troubleshooting

**Q: Bills not calculating the right amount?**
A: Check that the constants are correct in SuperAdmin dashboard

**Q: New utilities don't appear for Property Manager?**
A: Refresh the page or log out/in. The sync is instant but UI sometimes needs refresh

**Q: Can I change past bills?**
A: Editing a reading will recalculate using current constants. Old calculations are lost.

**Q: What if I set constant to 0?**
A: Bill for that utility = 0 (usage × 0 = 0)

---

## 🎓 Learning the Math

```
BillFormula = Σ(
  UsageMeteredUtilities × Constant + 
  FixedUtilities
)

Example:
Electricity = (150 - 100) × $50 = $2,500
Water = (210 - 200) × $30 = $300  
Garbage = $500
Security = $1,000
Services = $300
─────────────────
Total = $4,600
```

---

**Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: 26 Feb 2026
