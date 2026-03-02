# Payment Page Redesign - Testing Checklist

**Date:** February 28, 2026  
**Components:** Payments.tsx, MakePayment.tsx  
**Status:** Ready for QA Testing

---

## 🧪 Pre-Testing Setup

- [ ] Database has at least one tenant with active lease
- [ ] Database has rent_payments records for the tenant
- [ ] Database has utility_readings records for the tenant's unit
- [ ] Development server running: `npm run dev`
- [ ] Logged in as a tenant user
- [ ] Network requests visible in DevTools (F12 → Network)

---

## 📱 **Test 1: Page Load & Data Fetching**

### Test Case 1.1: Initial Load
- [ ] Navigate to `/portal/tenant/payments`
- [ ] **Expected:** Loading spinner appears briefly
- [ ] **Expected:** Page loads without errors
- [ ] **Check DevTools Console:** No error messages
- [ ] **Duration:** Page loads in < 2 seconds

### Test Case 1.2: Data Appears Correctly
- [ ] "My Payments" header displays
- [ ] "Current Bill Statement" card appears
- [ ] Total amount due shows a number (not NaN or undefined)
- [ ] Rent charges card is visible
- [ ] Utility bills card is visible

### Test Case 1.3: Network Requests
- [ ] Check Network tab in DevTools
- [ ] `GET /tenants` request succeeds (200)
- [ ] `GET /rent_payments` request succeeds (200)
- [ ] `GET /utility_readings` request succeeds (200)
- [ ] No 404 or 500 errors in requests

---

## 💰 **Test 2: Utility Breakdown Display**

### Test Case 2.1: Utility Components Visible
- [ ] Scroll down to "Utility Charges Breakdown" section
- [ ] Section header displays "Utility Charges Breakdown (Month Year)"
- [ ] All 6 utility component boxes are visible:
  - [ ] ⚡ Electricity box (Yellow icon)
  - [ ] 💧 Water box (Blue icon)
  - [ ] 🗑️ Garbage box (Green icon)
  - [ ] 🛡️ Security box (Purple icon)
  - [ ] 💳 Service box (Orange icon)
  - [ ] 📦 Other box (Red icon)

### Test Case 2.2: Utility Values Display
- [ ] Each component shows correct amount (KES format)
- [ ] ⚡ Electricity: Shows a number > 0
- [ ] 💧 Water: Shows a number ≥ 0
- [ ] 🗑️ Garbage: Shows a number > 0
- [ ] 🛡️ Security: Shows a number > 0
- [ ] 💳 Service: Shows a number ≥ 0 (may be 0)
- [ ] 📦 Other: Shows a number ≥ 0 (may be 0)

### Test Case 2.3: Component Descriptions
- [ ] Electricity: "Usage-based charge"
- [ ] Water: "Usage-based charge"
- [ ] Garbage: "Monthly fee"
- [ ] Security: "Monthly fee"
- [ ] Service: "Platform charge"

### Test Case 2.4: Breakdown Adds Up
- [ ] Sum of all components = Total utility due
- [ ] (Electricity + Water + Garbage + Security + Service + Other) = Total shown in header

---

## 📊 **Test 3: Bill Summary Cards**

### Test Case 3.1: Rent Card
- [ ] Title: "Rent Charges (This Month)"
- [ ] Subtitle: "Monthly housing cost"
- [ ] Shows "Total Rent: KES [amount]"
- [ ] Shows "Already Paid: KES [amount]"
- [ ] Shows "Amount Due: KES [amount]" in red if > 0
- [ ] [Pay Rent] button visible if amount due > 0

### Test Case 3.2: Utilities Card
- [ ] Title: "Utility Bills (This Month)"
- [ ] Subtitle: "Water, electricity & other charges"
- [ ] Shows "Total Due: KES [amount]"
- [ ] Shows "Already Paid: KES [amount]"
- [ ] Shows "Amount Due: KES [amount]" in red if > 0
- [ ] [Pay Utilities] button visible if amount due > 0

### Test Case 3.3: Total Due Display
- [ ] Large banner at top shows "Total Amount Due This Month"
- [ ] Shows total of (Rent + Utilities)
- [ ] Shows warning icon if amount > 0
- [ ] Shows checkmark icon if amount = 0

---

## 🗂️ **Test 4: Payment History Tabs**

### Test Case 4.1: Overview Tab
- [ ] Click "Overview" tab
- [ ] Table displays with columns:
  - [ ] Description (with icon)
  - [ ] Due Date
  - [ ] Amount
  - [ ] Paid
  - [ ] Balance
  - [ ] Status
  - [ ] Action
- [ ] Shows both rent and utility records
- [ ] Records sorted by date (newest first)
- [ ] Each row has a "Pay" button if unpaid

### Test Case 4.2: Rent Payments Tab
- [ ] Click "Rent Payments" tab
- [ ] Table shows only rent records
- [ ] Shows Home icon for each row
- [ ] All rent payments visible (multiple months)
- [ ] Paid amount shows correctly
- [ ] Balance calculated properly (Amount - Paid)
- [ ] Status badge shows correct color

### Test Case 4.3: Utility History Tab
- [ ] Click "Utility History" tab
- [ ] Table shows only utility records
- [ ] Displays columns for each utility component:
  - [ ] Month
  - [ ] ⚡ Electricity
  - [ ] 💧 Water
  - [ ] 🗑️ Garbage
  - [ ] 🛡️ Security
  - [ ] 💳 Service
  - [ ] 📦 Other
  - [ ] Total
  - [ ] Status
- [ ] Each component shows with icon
- [ ] All months visible (scrollable)
- [ ] Totals match breakdown view

### Test Case 4.4: Empty State (If No Data)
- [ ] If no records: "All Payments Current" message appears
- [ ] Checkmark icon displays
- [ ] "You have no outstanding payments" shown

---

## 🔘 **Test 5: Action Buttons**

### Test Case 5.1: Make Payment Button
- [ ] Header [Make Payment] button visible
- [ ] Clicking opens MakePayment page
- [ ] URL changes to `/portal/tenant/payments/make`

### Test Case 5.2: Pay Rent Button
- [ ] [Pay Rent] button visible in Rent card (if due > 0)
- [ ] Clicking navigates to `/portal/tenant/payments/make?type=rent`
- [ ] Payment form pre-fills with rent amount

### Test Case 5.3: Pay Utilities Button
- [ ] [Pay Utilities] button visible in Utilities card (if due > 0)
- [ ] Clicking navigates to `/portal/tenant/payments/make?type=utility`
- [ ] Payment form pre-fills with total utility amount

### Test Case 5.4: Pay from Table
- [ ] [Pay] buttons visible in table rows (if unpaid)
- [ ] Clicking navigates to payment page with correct type
- [ ] Amount parameter passed correctly

---

## 📱 **Test 6: Responsive Design**

### Test Case 6.1: Mobile View (375px)
- [ ] Open DevTools → Toggle device toolbar
- [ ] Set viewport to iPhone 12 (375 x 812)
- [ ] All content visible without horizontal scroll
- [ ] Utility breakdown shows vertically (1 column)
- [ ] Cards stack vertically
- [ ] Text readable without zoom
- [ ] Buttons large enough to tap

### Test Case 6.2: Tablet View (768px)
- [ ] Set viewport to iPad (768 x 1024)
- [ ] Utility breakdown shows in 2-column layout
- [ ] Cards arrange in 2 columns
- [ ] Tables scrollable horizontally if needed
- [ ] All elements properly spaced

### Test Case 6.3: Desktop View (1024px+)
- [ ] Set viewport to 1440 x 900
- [ ] Utility breakdown shows in 3-column layout
- [ ] All content visible without scrolling (except tables)
- [ ] Proper spacing and alignment

---

## 🎨 **Test 7: Visual Elements**

### Test Case 7.1: Colors
- [ ] Rent card: Blue background for background, blue icon
- [ ] Utilities card: Cyan background, cyan icon
- [ ] Utilities section: Gray background
- [ ] Status badges: Green (paid), Yellow (pending), Red (overdue)
- [ ] Amount due: Red text if unpaid, Green if paid

### Test Case 7.2: Icons
- [ ] 🏠 Home icon for rent
- [ ] 💧 Droplets icon for utilities
- [ ] ⚡ Zap icon for electricity
- [ ] 🗑️ Trash icon for garbage
- [ ] 🛡️ Shield icon for security
- [ ] 💳 CreditCard icon for service
- [ ] ⚠️ AlertTriangle for overdue
- [ ] ✅ CheckCircle for paid

### Test Case 7.3: Fonts & Text
- [ ] Headers bold and larger than body text
- [ ] Currency formatted as "KES 10,000" (comma separator)
- [ ] Dates formatted as "Feb 1, 2026"
- [ ] Descriptions in smaller, lighter text

### Test Case 7.4: Shadows & Effects
- [ ] Cards have subtle shadow effect
- [ ] Hover effects on buttons and cards
- [ ] Smooth transitions when clicking tabs

---

## 🔐 **Test 8: Data Accuracy**

### Test Case 8.1: Rent Calculations
- [ ] Total Rent = Sum of all rent amounts
- [ ] Already Paid = Sum of all rent amount_paid
- [ ] Amount Due = Total Rent - Already Paid
- [ ] Status: "pending" or "open" if due > 0
- [ ] Status: "completed" or "paid" if due = 0

### Test Case 8.2: Utility Calculations
- [ ] Each component value ≥ 0
- [ ] Total Bill = Sum of all components
- [ ] Total matches sum in table
- [ ] Status: "pending" if due > 0
- [ ] Status: "paid" if fully paid

### Test Case 8.3: Grand Total
- [ ] Total Due = Rent Due + Utilities Total
- [ ] Matches sum of all unpaid amounts

---

## 🔗 **Test 9: Navigation**

### Test Case 9.1: Back Navigation
- [ ] Back button at top left
- [ ] Clicking goes to `/portal/tenant` dashboard
- [ ] No errors on navigation

### Test Case 9.2: Tab Navigation
- [ ] Each tab switches without page reload
- [ ] Tab state persists if navigating back
- [ ] URL doesn't change when switching tabs

### Test Case 9.3: Deep Linking
- [ ] Direct URL access works: `/portal/tenant/payments`
- [ ] URL with parameters works: `/portal/tenant/payments/make?type=rent`

---

## 🔄 **Test 10: Make Payment Page**

### Test Case 10.1: Payment Type Selection
- [ ] Navigate to `/portal/tenant/payments/make`
- [ ] See 3 payment type cards:
  - [ ] "Pay All Bills" (Recommended badge)
  - [ ] "Rent Payment"
  - [ ] "Utility Bills"
- [ ] Clicking each updates selection

### Test Case 10.2: Rent Payment Flow
- [ ] Select "Rent Payment"
- [ ] Shows rent amount pre-filled
- [ ] Can adjust amount
- [ ] [Pay via Paystack] button shows
- [ ] Paystack dialog opens on click

### Test Case 10.3: Utility Payment Flow
- [ ] Select "Utility Bills"
- [ ] Shows utility amount pre-filled
- [ ] Can adjust amount
- [ ] [Pay via Paystack] button shows

### Test Case 10.4: Pay All Flow
- [ ] Select "Pay All Bills"
- [ ] Shows combined amount (rent + utilities)
- [ ] Amount correctly calculated
- [ ] [Pay via Paystack] button shows

---

## 💳 **Test 11: Payment Processing (Paystack)**

### Test Case 11.1: Dialog Opens
- [ ] Click [Pay via Paystack]
- [ ] Paystack dialog/form opens
- [ ] Email auto-filled
- [ ] Amount shows correctly

### Test Case 11.2: Test Payment (Use Paystack Test Card)
- [ ] Card: 4111 1111 1111 1111
- [ ] Expiry: Any future date
- [ ] CVV: Any 3 digits
- [ ] Complete payment flow
- [ ] Success message appears

### Test Case 11.3: Database Update After Payment
- [ ] Payment succeeds
- [ ] Refresh page
- [ ] Amount paid updates
- [ ] Status changes to "completed" or "partial"
- [ ] Payment doesn't appear twice

---

## 🔍 **Test 12: Error Handling**

### Test Case 12.1: Network Error
- [ ] Disable network (DevTools → Offline)
- [ ] Refresh page
- [ ] Error message appears: "Failed to load payments"
- [ ] Toast notification visible

### Test Case 12.2: Missing Data
- [ ] If no utility_readings: Message appears
- [ ] Gracefully handles missing utility data
- [ ] Page doesn't crash

### Test Case 12.3: Invalid User
- [ ] Logout and login as different user
- [ ] Shows correct user's data (not other user's)
- [ ] No data leakage

---

## ✅ **Test 13: Final Verification**

### Test Case 13.1: Build Check
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No console errors on page load

### Test Case 13.2: Performance
- [ ] Page loads in < 2 seconds
- [ ] Interactions responsive (no lag)
- [ ] Scrolling smooth
- [ ] Tabs switch instantly

### Test Case 13.3: Accessibility
- [ ] Tab navigation works (keyboard)
- [ ] Buttons focusable
- [ ] Color contrast sufficient
- [ ] Icons have descriptive alt text

### Test Case 13.4: Cross-Browser
- [ ] Chrome/Edge: ✅
- [ ] Firefox: ✅
- [ ] Safari: ✅
- [ ] Mobile browsers: ✅

---

## 📋 **Test Summary Report**

**Tester Name:** _______________  
**Date:** _______________  
**Build Version:** _______________  

### Results Overview
- [ ] All critical tests passed (Tests 1-8)
- [ ] Navigation tests passed (Test 9)
- [ ] Payment flow tested (Tests 10-11)
- [ ] Error handling verified (Test 12)
- [ ] Final verifications complete (Test 13)

### Issues Found
```
Issue #1: _________________________________
Severity: 🔴 High / 🟠 Medium / 🟡 Low
Steps to Reproduce: _______________________
Expected: _________________________________
Actual: __________________________________
```

### Sign-Off
- [ ] All critical issues resolved
- [ ] Approved for production release
- [ ] ReadyReady for tenant testing

**Tester Signature:** _____________________ **Date:** _______________

