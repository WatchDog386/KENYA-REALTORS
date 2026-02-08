# Vacancy Notice Feature Instructions

The "Vacancy / Move-Out Notice" feature has been fully implemented in the code. To enable it, you must apply the database changes.

## 1. Database Setup (Crucial)

Since RPC calls are limited, you must run the SQL manually in Supabase.

1.  Open your **Supabase Dashboard**.
2.  Go to the **SQL Editor**.
3.  Open the file `database/CREATE_VACANCY_NOTICES.sql` from your project in a text editor.
4.  Copy the entire content.
5.  Paste it into the Supabase SQL Editor and click **Run**.

## 2. Feature Overview

### For Tenants
- **Location**: Tenant Portal > Notice to Vacate (Sidebar).
- **Functionality**: 
  - Auto-fills property and unit details from their active lease.
  - Allows selecting a move-out date and reason.
  - Generates a preview of the "Official Notice" letter.
  - Shows the status of submitted notices (Pending, Inspection Scheduled, etc.).

### For Property Managers
- **Location**: Manager Portal > Tenants > Vacancy Notices.
- **Functionality**:
  - Lists all received vacancy notices.
  - **View**: See tenant details, reason, and dates.
  - **Actions**:
    - **Schedule Inspection**: Sets an inspection date and notifies the tenant (updates status).
    - **Mark Completed**: Finalizes the move-out process.
    - **Reject**: Declines the notice if invalid.

## 3. Files Created
- `database/CREATE_VACANCY_NOTICES.sql`: Database schema.
- `src/pages/portal/tenant/VacancyNotice.tsx`: Tenant submission form.
- `src/components/portal/manager/ManagerVacancyNotices.tsx`: Manager review dashboard.
- Routes and Navigation updated in `App.tsx`, `TenantPortalLayout.tsx`, and `ManagerLayout.tsx`.
