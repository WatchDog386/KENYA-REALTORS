# 🚀 Quick Start Guide - Super Admin

## How to Use the New System

### Approve Users (First Priority!)

#### Step 1: Go to User Management
1. Click on Dashboard top menu
2. Click "Users" link in the side menu
3. OR Go directly to: `/portal/super-admin/users`

#### Step 2: Find Pending Users
1. Look for users with **🟡 PENDING** status
2. OR use filter: Select "Pending Approval" from status dropdown
3. Users are sorted by most recent registration

#### Step 3: Approve a User
1. Click the blue **[Approve]** button next to the user
2. A dialog will pop up confirming the action
3. Click **[Approve User]** button in the dialog
4. User status changes to **🟢 ACTIVE** immediately
5. User can now login

#### What Happens After:
- User status changes to `active`
- User can login immediately
- User sees their dashboard (tenant/manager)
- Email notification (if configured)

---

### Assign Properties to Managers

#### Step 1: Go to Property Managers
1. From Super Admin Dashboard
2. Click **[Property Managers]** quick action button
3. OR Go to: `/portal/super-admin/managers`

#### Step 2: Find a Manager
1. See list of all Property Managers
2. Search by name/email if needed
3. Look for **[Assign Properties]** button

#### Step 3: Assign a Property
1. Click **[Assign Properties]** button for a manager
2. Select property from dropdown (e.g., "Sunrise Apartment")
3. Click **[Assign]** button
4. You'll see success message

#### What Happens After:
- Property appears under manager's name
- Manager's assigned count increases
- Manager can see it on their dashboard
- Property saved in database for future reference

---

### Suspend or Delete Users

#### Suspend a User (Temporary)
1. Go to User Management page
2. Find the user with **🟢 ACTIVE** status
3. Click **[Suspend]** button
4. Confirm in dialog
5. User status becomes **🔴 SUSPENDED**
6. User **cannot login** anymore
7. User can be reactivated later

#### Delete a User (Permanent)
1. Go to User Management page
2. Click **[Delete]** button for any user
3. ⚠️ **Red warning dialog appears** - User will be permanently deleted
4. Confirm by clicking **[Delete User]**
5. User is completely removed from system
6. **Cannot be undone!**

---

## Dashboard Quick Reference

### Super Admin Dashboard
```
┌─────────────────────────────────────────────────┐
│  Super Admin Dashboard                          │
│                                                 │
│  Quick Actions:                                 │
│  [Users]  [Properties]  [Property Managers] ... │
│                                                 │
│  Metrics:                                       │
│  Total Properties: 1    Active Users: 3         │
│  Pending Approvals: 2   Occupancy: 66%          │
└─────────────────────────────────────────────────┘
```

### Key Buttons

| Button | Purpose | Where |
|--------|---------|-------|
| **[Users]** | Manage all users, approve/suspend/delete | Dashboard Quick Actions |
| **[Property Managers]** | Assign properties to managers | Dashboard Quick Actions |
| **[Approve]** | Activate pending user | User Management Table |
| **[Suspend]** | Temporarily block active user | User Management Table |
| **[Delete]** | Permanently remove user | User Management Table |
| **[Assign Properties]** | Assign property to manager | Property Managers List |

---

## User Status Reference

### Status Indicators

| Status | Icon | Meaning | Can Login? |
|--------|------|---------|-----------|
| **Pending** | 🟡 | New registration, awaiting approval | ❌ No |
| **Active** | 🟢 | Approved and active user | ✅ Yes |
| **Suspended** | 🔴 | Temporarily blocked | ❌ No |

---

## Common Tasks

### Task: Review All New Users
1. Go to `/portal/super-admin/users`
2. Filter: "Pending Approval" 
3. See stats showing pending count
4. Approve each one by clicking [Approve]

### Task: Assign Sunrise Apartment to John Doe
1. Go to `/portal/super-admin/managers`
2. Search for "John Doe"
3. Click [Assign Properties]
4. Select "Sunrise Apartment"
5. Click [Assign]
6. John now sees it on his dashboard

### Task: Deactivate a Troublemaking Manager
1. Go to `/portal/super-admin/users`
2. Search for manager name
3. Click [Suspend] button
4. Confirm in dialog
5. Manager cannot login anymore

### Task: Completely Remove a User
1. Go to `/portal/super-admin/users`
2. Click [Delete] button
3. ⚠️ Confirm the permanent deletion
4. User is gone from system

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` (forward slash) | Focus search bar |
| `Esc` | Close dialogs |
| `Enter` | Confirm action in dialog |

---

## Notifications You'll See

### ✅ Success Notifications (Green)
- "✅ User approved successfully!"
- "⏸️ User suspended successfully!"
- "🗑️ User deleted successfully!"
- "Property assigned to manager successfully"

### ❌ Error Notifications (Red)
- "Failed to approve user: [reason]"
- "User must have active status to delete"
- "Please select both property and manager"

---

## Tips & Tricks

### Pro Tip #1: Batch Review
1. Filter for "Pending Approval"
2. Open 2-3 user details
3. Approve them one by one
4. Refresh to see updated list

### Pro Tip #2: Search Smart
- Search by email: "john@example.com"
- Search by name: "John Doe"
- Search by partial: "john" or "doe"

### Pro Tip #3: Track Assignments
- Look at "Assigned" count for each manager
- If count is 0, that manager needs properties
- Click [Assign Properties] to fix

### Pro Tip #4: Confirm Before Deleting
- Always check the user's role first
- Confirm you have the right person
- Read the deletion warning carefully
- Deletion is permanent!

---

## FAQ

### Q: What does "Pending" mean?
**A:** User just registered and is waiting for you to approve them. They cannot login yet.

### Q: How do I approve a user?
**A:** Go to User Management, find the pending user, click [Approve], confirm in dialog.

### Q: Can I undo a deletion?
**A:** No! Deletion is permanent. Think carefully before deleting.

### Q: What if I approve the wrong person?
**A:** Click [Suspend] to temporarily block them. Then delete if necessary.

### Q: How do I assign properties?
**A:** Go to Property Managers page, click [Assign Properties] for manager, select property, click [Assign].

### Q: Where do managers see their properties?
**A:** On their dashboard at `/portal/manager` - shows in "Assignment Status" section.

### Q: Can managers have multiple properties?
**A:** System currently supports one property per manager. Can be extended.

---

## Workflow Chart

```
New User Registration
    ↓
Status = "PENDING" 🟡
    ↓
You Review in User Management
    ↓
You Click [Approve]
    ↓
Status = "ACTIVE" 🟢
    ↓
User Can Login
    ↓
You Assign Properties
    ↓
Manager Sees Properties on Dashboard
    ↓
Manager Can Work
```

---

## Contact & Support

If something breaks:
1. Check the error message in red toast notification
2. Try refreshing the page
3. Check database directly via Supabase console
4. Check browser console for JavaScript errors (F12)

---

## Version Info
- **Last Updated**: February 4, 2026
- **Status**: ✅ Production Ready
- **Users**: Super Admin only
- **Training Time**: 5-10 minutes

---

**You're all set! Start by approving pending users. Then assign properties to property managers. Questions? Check the detailed guide in USER_MANAGEMENT_COMPLETE.md**
