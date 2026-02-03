# 🚀 Unified Registration & Approval - Quick Start (5 Minutes)

## What's New?
Both **Property Managers** and **Tenants** now have the same registration flow:
1. Register with their role
2. Await Super Admin approval in one dashboard
3. Can login after approval
4. Auto-redirect to their portal (Manager or Tenant)

---

## 📋 What You Need to Do

### **STEP 1: Apply Database Migration** (2 min)
```
File: supabase/migrations/20260204_unified_registration_approval_workflow.sql

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire SQL file content
4. Paste into editor
5. Click "Run"
6. Wait for completion
```

### **STEP 2: Verify Files Are Updated** (1 min)
These files have ALREADY been updated in your workspace:
- ✅ `src/pages/auth/RegisterPage.tsx` - Manager approval logic added
- ✅ `src/pages/auth/LoginPage.tsx` - Approval status check added  
- ✅ `src/components/portal/super-admin/UserManagementNew.tsx` - Approval UI added

### **STEP 3: Restart Dev Server** (1 min)
```bash
npm run dev
# or
bun run dev
```

### **STEP 4: Test It** (1 min)
```
1. Open http://localhost:5173/register
2. Select "Property Manager" 
3. Fill in: Name, Email, Phone, Password
4. Select a property to manage
5. Click "Create Account"
   → Should say "Awaiting admin approval"
6. Try to login
   → Should say "Your account is pending approval"
7. Go to Super Admin Dashboard
8. Click User Management → User Users
9. Click "⏳ Pending Approval" filter
10. See your registered manager in list
11. Click "Assign Role" button on the row
12. Confirm role "Property Manager"
13. Click "✓ Approve & Assign Role"
14. Try login again
    → Should work! Redirects to /portal/manager
```

---

## 🔄 How It Works (30 Second Summary)

### **Registration:**
```
User registers → Profile created with status='pending' → 
Super Admin notified → User can't login yet
```

### **Super Admin Review:**
```
Go to User Management dashboard → 
See "⏳ Pending Approval" users → 
Click to approve → User notified → 
User can now login
```

### **Login:**
```
User enters credentials → System checks status → 
If pending: "Your account is pending approval" ❌
If active: Logs in and redirects to their portal ✅
```

---

## 📊 What's in the Dashboards?

### **Registration Page (/register):**
- **Tenant Option:** Select property + unit
- **Property Manager Option:** Select properties to manage
- Both ask for: Name, Email, Phone, Password

### **Login Page (/login):**
- Checks if user is approved before allowing access
- Shows helpful message if pending

### **Super Admin Dashboard → User Management:**
- **Filter:** "⏳ Pending Approval" to see waiting users
- **Table:** Shows all users with status (Pending/Active)
- **Action:** Click row to assign role & approve
- **Result:** User gets notified and can login

---

## ✅ Success Indicators

After completing setup, you should see:

✅ Property managers can register  
✅ Tenants can register  
✅ Both go to "awaiting approval" message  
✅ Super admin sees them in User Management  
✅ Can filter "⏳ Pending Approval"  
✅ Can click to assign role  
✅ User is approved and notified  
✅ User can login after approval  
✅ Redirects to correct portal (manager or tenant)  

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Users don't appear in dashboard | Make sure migration was applied |
| Approval button gives error | Check browser console, verify super admin role |
| User approved but still can't login | Refresh page, check profiles table status='active' |
| Notification not sent | Check notifications table exists and RLS allows inserts |

---

## 📚 Full Documentation

For complete details, see: `UNIFIED_REGISTRATION_AND_APPROVAL_SYSTEM.md`

---

**You're ready to go! 🎉**
