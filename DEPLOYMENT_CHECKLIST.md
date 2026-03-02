# 📋 DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment

- [x] Code implemented
- [x] TypeScript compilation successful
- [x] Build completed (0 errors)
- [x] Database migration created
- [x] Documentation complete
- [x] Review completed

---

## 🚀 Deployment Steps

### Phase 1: Database Migration

**Prerequisite**: Access to Supabase Dashboard

- [ ] **Step 1**: Open [Supabase Dashboard](https://app.supabase.com)
  
- [ ] **Step 2**: Select your project from the dropdown
  
- [ ] **Step 3**: Go to **SQL Editor** (left sidebar)
  
- [ ] **Step 4**: Click **New Query**
  
- [ ] **Step 5**: Copy the SQL from file:
  ```
  database/20260226_add_utility_constants.sql
  ```
  
- [ ] **Step 6**: Paste into the SQL editor
  
- [ ] **Step 7**: Click **Run** button
  
- [ ] **Step 8**: Verify success (should show "Execute completed successfully")

### Phase 2: Verification

Run these verification queries in Supabase SQL Editor:

- [ ] **Verify table exists**:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'utility_constants';
  ```
  Expected result: `utility_constants`

- [ ] **Verify columns exist**:
  ```sql
  SELECT * FROM public.utility_constants LIMIT 1;
  ```
  Expected columns: id, utility_name, constant, is_metered, description, created_at, updated_at, custom_data

- [ ] **Verify default data**:
  ```sql
  SELECT utility_name, constant, is_metered FROM public.utility_constants;
  ```
  Expected 5 rows: Electricity, Water, Garbage, Security, Service

- [ ] **Verify settings columns**:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'utility_settings' 
  AND column_name IN ('water_constant', 'electricity_constant');
  ```
  Expected 2 rows: water_constant, electricity_constant

### Phase 3: Application Restart

- [ ] **Stop current dev/prod server**
  - If dev: Press `Ctrl+C` in terminal
  - If production: Use your deployment system

- [ ] **Clear build cache**:
  ```bash
  rm -rf dist node_modules/.vite
  # or on Windows:
  # rmdir /s dist; rmdir /s node_modules\.vite
  ```

- [ ] **Restart application**:
  ```bash
  npm run dev
  # or
  npm run build && npm start
  ```

- [ ] **Wait for build to complete** (1-2 minutes)

- [ ] **Verify no build errors** in console output

---

## 🧪 Testing Phase

### Smoke Tests (Quick Checks)

- [ ] **Application loads** without errors
  
- [ ] **Can login** as SuperAdmin
  
- [ ] **Can navigate** to Utility Management dashboard
  
- [ ] **Page loads** without errors

### SuperAdmin Feature Tests

- [ ] **Navigate** to Utility Management → Manage Utility Constants
  
- [ ] **View constants table** with 5 default utilities
  
- [ ] **Edit a constant**:
  - Click on any constant value
  - Change it (e.g., 1 → 50)
  - Refresh page to verify it was saved
  
- [ ] **Add custom utility**:
  - Click "Add Utility" button
  - Enter name: "Test Utility"
  - Enter constant: 100
  - Select type: Fixed
  - Click "Add Utility"
  - Verify it appears in table
  
- [ ] **Set prices**:
  - Edit water_fee, electricity_fee, garbage_fee
  - Click "Save Settings"
  - Verify success message

### Property Manager Feature Tests

- [ ] **Navigate** to Utility Readings → Add Meter Reading
  
- [ ] **View calculation guide**:
  - Should show formulas for all utilities
  - Metered utilities: "(Current - Previous) × Constant"
  - Fixed utilities: "Fixed amount"
  
- [ ] **Select unit** and see details populate
  
- [ ] **Verify prefilled rates**:
  - Water constant shows
  - Electricity constant shows
  - All fixed fees show
  
- [ ] **Create test reading**:
  - Select unit
  - Enter readings
  - Click Save
  - Verify bill calculated correctly
  
- [ ] **Edit reading**:
  - Click edit on a reading
  - Change values
  - Click Save
  - Verify calculation updates

### Tenant Feature Tests

- [ ] **View bill** in Tenant Dashboard
  
- [ ] **See breakdown** with correct amounts
  
- [ ] **Can pay** via Paystack

---

## 🔍 Regression Testing

Verify existing functionality still works:

- [ ] **Old readings** still display correctly
  
- [ ] **Bill history** not affected
  
- [ ] **Tenant payments** still work
  
- [ ] **Paystack integration** still works
  
- [ ] **Other dashboards** load normally
  
- [ ] **No console errors** in browser DevTools

---

## 📊 Data Validation Tests

- [ ] **Constants cannot be negative** (try entering -1)
  
- [ ] **Utility names must be unique** (try adding duplicate)
  
- [ ] **Readings require unit_id** (try saving without selecting unit)
  
- [ ] **Bills calculate correctly**:
  - Electricity: (150-100) × 50 = 2,500 ✓
  - Water: (210-200) × 30 = 300 ✓
  - Garbage: 500 (fixed) ✓

---

## 🔐 Security Validation

- [ ] **Property Manager cannot edit constants**
  
- [ ] **Tenant cannot see constants** (if applicable)
  
- [ ] **Non-authenticated users** redirected to login
  
- [ ] **SuperAdmin-only** features require superadmin role

---

## 📱 Cross-Browser Testing

- [ ] **Chrome**: Works correctly
  
- [ ] **Firefox**: Works correctly
  
- [ ] **Safari**: Works correctly
  
- [ ] **Edge**: Works correctly
  
- [ ] **Mobile**: Responsive design works

---

## 📈 Performance Testing

- [ ] **Page load time**: < 2 seconds
  
- [ ] **Form submission**: < 1 second
  
- [ ] **Data fetch**: < 500ms
  
- [ ] **No console errors** or warnings

---

## 🎯 Final Verification

- [ ] **All tests passed**
  
- [ ] **No errors in console**
  
- [ ] **Database connected** and responsive
  
- [ ] **Constants** properly configured
  
- [ ] **Bills calculating** correctly
  
- [ ] **Users can complete workflow**: SuperAdmin → Manager → Tenant

---

## ✅ Sign-Off

| Item | Date | Tester | Notes |
|------|------|--------|-------|
| Database Migration | __/__/__ | __________ | ____________ |
| Build Verification | __/__/__ | __________ | ____________ |
| SuperAdmin Tests | __/__/__ | __________ | ____________ |
| Manager Tests | __/__/__ | __________ | ____________ |
| Tenant Tests | __/__/__ | __________ | ____________ |
| Regression Tests | __/__/__ | __________ | ____________ |
| Security Tests | __/__/__ | __________ | ____________ |
| Production Ready | __/__/__ | __________ | ____________ |

---

## 🆘 Troubleshooting

### Issue: Database migration fails

**Solution**:
1. Check Supabase is connected
2. Verify you're in correct project
3. Read error message carefully
4. Use `IF NOT EXISTS` clauses (already in migration)
5. Try running one command at a time

### Issue: Build fails with TypeScript errors

**Solution**:
1. Delete node_modules: `rm -rf node_modules`
2. Reinstall: `npm install`
3. Clear cache: `npm cache clean --force`
4. Rebuild: `npm run build`

### Issue: Constants not showing in Property Manager

**Solution**:
1. Hard refresh page: `Ctrl+Shift+R`
2. Clear browser cache
3. Check database query: `SELECT * FROM utility_constants;`
4. Verify constants were created correctly

### Issue: Bills not calculating correctly

**Solution**:
1. Check constant value in database
2. Verify formula: (current - previous) × constant
3. Check data types (should be DECIMAL)
4. Try creating new reading with known values

### Issue: Permission denied errors

**Solution**:
1. Verify user role in profiles table
2. Check RLS policies in Supabase
3. Verify SuperAdmin has role = 'superadmin'
4. Clear browser cache and re-login

---

## 📞 Need Help?

Refer to these documents:

- **EXECUTIVE_SUMMARY.md** - Overview of changes
- **IMPLEMENTATION_COMPLETE.md** - Feature details
- **DATABASE_MIGRATION_GUIDE.md** - SQL help
- **UTILITY_SYSTEM_GUIDE.md** - User guide
- **IMPLEMENTATION_VERIFICATION_REPORT.md** - Technical details

---

## 🎊 Deployment Complete!

Once all checkboxes are checked ✅, your system is ready to use!

**Estimated time for deployment**: 30 minutes  
**Estimated time for testing**: 1-2 hours  
**Total**: 2-3 hours  

---

**Deployment Date**: _______________  
**Deployer**: _______________  
**Status**: ✅ COMPLETE / ⏳ IN PROGRESS / ❌ FAILED  

