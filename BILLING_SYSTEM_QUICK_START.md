# QUICK START GUIDE - Property Manager Billing System

## 🚀 For Property Managers

### How to Add a Meter Reading

1. **Log in** to your Property Manager portal
2. Go to **Billing and Invoicing** (Left menu → Utilities)
3. Click the **"+Add Reading"** button on any unit
4. Fill in the form:
   - **Unit**: Select from dropdown
   - **Reading Month**: Select month/year
   - **Electricity Current**: Enter current meter value
   - **Water Current**: Enter current meter value
   - Fixed fees auto-fill (cannot change)
5. Review the **Bill Calculation Breakdown** section
6. Click **"Save Reading"**

### ✅ What Happens Automatically

When you save a reading:
- ✅ Bill is calculated instantly
- ✅ SuperAdmin sees it immediately (no delay)
- ✅ Tenant gets notified of their bill
- ✅ Tenant can pay online

### 📝 Important Notes

- **You cannot change:** Electricity rate, water rate, garbage fee, security fee, service fee
- **You can change:** Meter readings and "other charges"
- **Previous readings** auto-fetch from database
- **Bill breakdown** is shown before you save

---

## 🎯 For SuperAdmins

### View and Manage Tenant Bills

1. **Log in** to SuperAdmin portal
2. Go to **Utilities Manager** → **Billing & Invoicing**
3. See all tenants with their:
   - Current bills from property managers
   - Payment status
   - Last reading date

### Edit and Send Invoices

1. Click **Edit Invoice** button (pencil icon)
2. Modify invoice amounts if needed
3. Add notes for tenant
4. Click **"Save & Send"** to email to tenant
   - OR click **"Download PDF"** to save locally

### Configure Utility Rates

1. Go to **Settings** → **Utility Constants**
2. Set rates/fees that property managers must use
3. Add custom utilities if needed
4. Changes apply to all new readings automatically

### 📊 Dashboard Features

- See readings added by property managers in real-time
- Track payment status (pending/paid)
- Generate and customize invoices
- Download invoices as PDF
- Email invoices to tenants

---

## 💰 For Tenants

### View Your Bills

1. **Log in** to Tenant portal
2. Go to **Payments**
3. See all bills with:
   - Amount due
   - Due date
   - Itemized breakdown
   - Payment status

### Understand Your Bill Breakdown

Each utility bill shows:
- **Electricity**: (Current - Previous) × Rate
- **Water**: (Current - Previous) × Rate
- **Fixed Fees**: Garbage, security, service charges
- **Other Charges**: Any additional fees

### Pay Your Bill

1. Click **"Pay Bill"** button
2. Confirm amount
3. Choose payment method (Paystack)
4. Complete payment
5. Receive receipt via email

### 📱 Real-time Updates

Your bills update automatically when:
- Property manager adds a meter reading
- SuperAdmin modifies an invoice
- You make a payment

No need to refresh - everything updates instantly!

---

## 🔄 Real-Time Sync Timeline

```
Property Manager adds reading (2:00 PM)
    ↓ (instant - under 1 second)
SuperAdmin sees reading (2:00:00 PM)
    ↓ (instant - under 1 second)  
Tenant sees bill (2:00:00 PM)
    ↓
Tenant can pay (2:00:01 PM)
```

---

## 🛠️ Troubleshooting Quick Fixes

### "I don't see my units"
- Check that you're assigned to a property
- Ask SuperAdmin to assign you to properties

### "The bill isn't showing up"
- Wait a few seconds - it updates in real-time
- Try refreshing the page
- Check internet connection

### "The numbers don't look right"
- Click into the reading to see the breakdown
- Verify current meter reading is correct
- Check that SuperAdmin set baseline values

### "I can't change the rates"
- This is correct! Only SuperAdmin sets rates
- Property managers can only enter meter readings
- Contact SuperAdmin to change rates

---

## 📞 Key Contacts & Resources

### Database Health Check
- If readings aren't showing up, check:
  1. Your unit is assigned to a property
  2. Your property is assigned to you (managers)
  3. Internet connection is stable

### Common Issues Checklist
- [ ] Are you logged in?
- [ ] Are you on the right page?
- [ ] Did you wait for real-time sync (usually instant)?
- [ ] Is your internet connection stable?
- [ ] Did you try refreshing?

---

## 📚 Detailed Documentation

For full technical documentation, see:
- `PROPERTY_MANAGER_BILLING_ACTIVATION.md` - Complete system guide
- Supabase realtime documentation - Technical details

---

## Sample Workflow

### Example: Full Month Billing Cycle

**Day 1 (Property Manager):**
1. Login to manager portal
2. Add electricity reading for Unit A
3. Add water reading for Unit A
4. System calculates bill: **KES 15,500**
5. Click Save

**Day 1 (SuperAdmin):**
1. Logs in
2. Sees new reading immediately
3. Reviews bill
4. Clicks "Save & Send" to email tenant

**Day 1 (Tenant):**
1. Logs in
2. Sees new bill for KES 15,500
3. Can see breakdown: Electricity (3,000) + Water (2,500) + Rent (10,000)
4. Clicks "Pay Bill"
5. Completes Paystack payment
6. Receives receipt

**Result:**
- ✅ Bill tracked
- ✅ Payment recorded
- ✅ No invoicing delays
- ✅ Complete transparency

---

## Key Features at a Glance

| Feature | Property Manager | SuperAdmin | Tenant |
|---------|-----------------|-----------|--------|
| Add readings | ✅ | ❌ | ❌ |
| Edit readings | ✅ | ❌ | ❌ |
| Set rates | ❌ | ✅ | ❌ |
| View bills | ✅ (own) | ✅ (all) | ✅ (own) |
| Edit invoices | ❌ | ✅ | ❌ |
| Send invoices | ❌ | ✅ | ❌ |
| Pay bills | ❌ | ❌ | ✅ |
| See payments | ✅ | ✅ | ✅ |

---

## Questions?

Check the full documentation or contact your system administrator.

Last Updated: March 4, 2026
