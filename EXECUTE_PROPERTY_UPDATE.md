# Property System Overhaul - Execution Guide

I have completely overhauled the Property Management system as requested. 

## Changes Made

1.  **Database Schema**:
    *   Designed a clean, efficient schema for `properties` and `property_unit_types`.
    *   Created a migration to **delete** all existing properties and mock data.
    *   Logic to support breakdown of units (Bedsitter, One Bedroom, etc.) with individual prices.

2.  **Frontend Logic**:
    *   **New Modal**: added `AddPropertyModal` to handle the new creation flow with dynamic unit types.
    *   **Services**: Created `propertyService.ts` to handle API communication and **auto-calculation** of Total Units and Expected Monthly Income.
    *   **Dashboard**: Updated `PropertiesManagement.tsx` to display real data from the database, showing calculated income and unit breakdowns.

## ⚠️ Action Required: Apply Database Changes

To activate the new system and clear existing mock data, you must run the migration script I created.

### Option 1: Using Supabase Dashboard (SQL Editor)
1.  Go to your Supabase Project Dashboard.
2.  Open the **SQL Editor**.
3.  Copy the content of the file: `supabase/migrations/20260209_reset_properties_schema.sql`
4.  Paste it into the SQL Editor and click **Run**.

### Option 2: Using Terminal (if Supabase CLI is linked)
Run the following command in your terminal:
```bash
npx supabase migration up
```

## Testing the Changes

1.  Start your application (`npm run dev`).
2.  Navigate to **Super Admin Portal > Properties**.
3.  You should see the **Fresh Mock Properties** (Sunrise Apartments, Green Valley Estate, etc.).
4.  Click **"Add Property"**.
5.  Fill in Name, Location, Image.
6.  Add Unit Types (e.g., "Bedsitter", "5", "15000").
7.  See the **Expected Income** update automatically at the bottom of the modal.
8.  Click **Create** and verify it appears in the list.
9.  Try **Deleting** a property to verify the action.
