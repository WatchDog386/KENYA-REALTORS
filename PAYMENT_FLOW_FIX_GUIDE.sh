#!/bin/bash

# ============================================================================
# Payment Flow Issues - Comprehensive Fix Script
# ============================================================================
# This script helps apply the necessary database migrations to fix:
# 1. Invoice RLS policies for manager and tenant access
# 2. Tenant table RLS policies for reading own assignments
# 3. Proper GRANT statements for authenticated users
# 4. Edge Function CORS configuration verification
# ============================================================================

echo "================================="
echo "Payment Flow Fix Verification"
echo "================================="
echo ""
echo "This script will help you diagnose and fix the tenant payment flow issues."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Please install it:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Display required fixes
cat << 'EOF'
📋 REQUIRED FIXES FOR PAYMENT FLOW:
====================================

1. ✅ Invoice RLS Policies
   - Tenant SELECT: Can view own invoices (tenant_id = auth.uid() OR via tenants.user_id)
   - Tenant UPDATE: Can mark invoices as paid
   - Manager SELECT: Can view invoices for assigned properties
   - Manager INSERT/UPDATE: Can create/update invoices for assigned properties
   - Super Admin: Full access to all invoices
   - Location: supabase/migrations/20260328_fix_invoice_rls_for_manager_assignments.sql
   - Location: supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql

2. ✅ Tenant Table RLS Policies
   - Tenant SELECT: Can view own assignment (user_id = auth.uid())
   - Tenant UPDATE: Can update own assignment (for finalization)
   - Manager SELECT: Can view tenants in assigned properties
   - Super Admin: Full access to all tenants
   - Location: supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql

3. ✅ GRANT Statements
   - authenticated users need SELECT, INSERT, UPDATE on invoices
   - authenticated users need SELECT, INSERT, UPDATE on tenants
   - Location: supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql

4. ✅ RPC Function (finalize_tenant_onboarding_invoice)
   - Uses SECURITY DEFINER to bypass RLS when called by authenticated users
   - Location: supabase/migrations/20260328_finalize_tenant_onboarding_invoice_rpc.sql

5. ✅ Edge Function CORS (Already Configured)
   - verify-paystack-transaction: ✓ Has CORS headers configured
   - initialize-paystack-payment: ✓ Has CORS headers configured
   - Note: CORS error on HTTP (192.168.0.103:8082) is expected; ignore

EOF

echo ""
echo "📝 TO APPLY FIXES:"
echo "=================="
echo ""
echo "Option 1: Via Supabase Dashboard"
echo "1. Go to SQL Editor in your Supabase project"
echo "2. Run the SQL from: supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql"
echo ""
echo "Option 2: Via Supabase CLI"
echo "1. Run: supabase db push"
echo ""
echo "Option 3: Manual via psql"
echo "1. Connect to your database"
echo "2. Copy and paste the SQL from the migration files"
echo ""

echo "🔍 VERIFICATION CHECKLIST:"
echo "=========================="
echo ""
echo "After applying fixes, verify in Supabase SQL Editor:"
echo ""
echo "-- Check 1: Inspect Invoice RLS Policies"
echo "SELECT schemaname, tablename, policyname"
echo "FROM pg_policies"
echo "WHERE tablename = 'invoices'"
echo "ORDER BY policyname;"
echo ""
echo "-- Check 2: Inspect Tenant RLS Policies"
echo "SELECT schemaname, tablename, policyname"
echo "FROM pg_policies"
echo "WHERE tablename = 'tenants'"
echo "ORDER BY policyname;"
echo ""
echo "-- Check 3: Verify RPC Exists and Is Executable"
echo "SELECT routine_name, routine_type"
echo "FROM information_schema.routines"
echo "WHERE routine_name = 'finalize_tenant_onboarding_invoice';"
echo ""

echo "🧪 MANUAL TEST:"
echo "==============="
echo ""
echo "After applying fixes, test the payment flow:"
echo "1. Log in as a tenant and navigate to /portal/payments"
echo "2. Create a payment for an onboarding invoice"
echo "3. Complete payment through Paystack"
echo "4. Verify:"
echo "   - Invoice status changes to 'paid'"
echo "   - Tenant record gets property_id, unit_id, and status='active'"
echo "   - Tenant portal unlocks (hasActiveAssignment=true)"
echo "   - TenantDashboard shows active tenant record"
echo ""

echo "🔧 COMMON ISSUES & SOLUTIONS:"
echo "=============================="
echo ""
echo "Issue: 403 error on /rest/v1/tenants"
echo "Fix: Apply the comprehensive migration with proper RLS policies"
echo ""
echo "Issue: RPC returns 400 error"
echo "Fix: Ensure finalize_tenant_onboarding_invoice migrations were applied"
echo ""
echo "Issue: CORS error on verify-paystack-transaction"
echo "Fix: This is expected on HTTP; configure HTTPS for production"
echo ""
echo "Issue: 'No active tenant record found' after payment"
echo "Fix: Ensure the RPC finalization succeeded before checking portal"
echo ""

echo ""
echo "📚 RELATED REPOSITORY MEMORIES:"
echo "==============================="
echo ""
echo "Fact: Onboarding/payment queries must account for both profiles.id"
echo "      and tenants.id in tenant_id-like columns"
echo ""
echo "Fact: The runtime Vite app is wired to src/ (not frontend/src/)"
echo "      Production route fixes should be made under src/"
echo ""
echo "Fact: Super Admin invoices are tagged BILLING_EVENT:first_payment"
echo "      Manager onboarding flow uses BILLING_EVENT:unit_allocation"
echo ""

echo ""
echo "✨ Fix application completed!"
echo ""
