# Property Manager Approval Workflow

## Overview
Implemented a complete workflow for Property Manager registration, approval, and login.

## Changes Made

### 1. Registration (`src/pages/auth/RegisterPage.tsx`)
- Updated registration logic to explicitly set `status: 'pending'` for new Property Managers.
- Other roles default to `active` (or handle their own verification flow).

### 2. Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- Added a new **"Approvals"** tab.
- Dashboard now fetches real user data from Supabase.
- Lists Property Managers with `status: 'pending'`.
- Added an **"Approve Access"** button which:
  - Updates user status to `'active'`.
  - Sets `is_active` to `true`.
  - Toasts a success message.

### 3. Authentication Logic (`src/contexts/AuthContext.tsx`)
- Updated `UserProfile` interface to include the `status` field.
- Updated `handlePostLoginRedirect` to check for pending status.
- **Result:** If a Property Manager logs in while pending, they are redirected to their Profile page (instead of the Manager Portal) effectively restricting their access until approved.

## How to Test

1. **Sign Up as Property Manager:**
   - Go to `/register`.
   - Select "Property Manager".
   - Complete signup.
   - You should see a "Registration successful! Awaiting admin approval" toast.

2. **Login as Super Admin:**
   - Log out.
   - Log in as `duncanmarshel@gmail.com`.
   - Go to Admin Dashboard.
   - Click the **Approvals** tab.
   - You should see the new user listed.
   - Click **Approve Access**.

3. **Verify Login:**
   - Log out.
   - Log in as the new Property Manager.
   - You should now be redirected to the Property Manager Portal (`/portal/manager`).

## Database Note
This workflow relies on the columns `role`, `status`, and `is_active` in the `profiles` table, which are already present and populated.
