-- ============================================================================
-- Migration: Fix RLS for Related Tables (tenant_verifications, manager_approvals)
-- Date: February 1, 2026
-- Purpose: Ensure all tables involved in registration have proper RLS policies
-- ============================================================================

-- ============================================================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX: tenant_verifications RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Tenants can view their own verifications" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Property managers can view verifications for their properties" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Super admins can view all verifications" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Tenants can insert their own verification requests" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Property managers can update verifications for their properties" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Service role can manage" ON public.tenant_verifications;
DROP POLICY IF EXISTS "tenant_verifications_service_role" ON public.tenant_verifications;
DROP POLICY IF EXISTS "tenant_verifications_insert_own" ON public.tenant_verifications;
DROP POLICY IF EXISTS "tenant_verifications_select_own" ON public.tenant_verifications;

-- Service role (backend) can do everything
CREATE POLICY "tenant_verifications_service_role"
  ON public.tenant_verifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tenants can insert their own verification request
CREATE POLICY "tenant_verifications_insert_own"
  ON public.tenant_verifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = tenant_id 
    OR auth.role() = 'service_role'
  );

-- Tenants can view their own verification
CREATE POLICY "tenant_verifications_select_own"
  ON public.tenant_verifications
  FOR SELECT
  USING (
    auth.uid() = tenant_id 
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- FIX: manager_approvals RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Managers can view their own approval" ON public.manager_approvals;
DROP POLICY IF EXISTS "Super admins can view all approvals" ON public.manager_approvals;
DROP POLICY IF EXISTS "Managers can insert their own approval request" ON public.manager_approvals;
DROP POLICY IF EXISTS "Super admins can update approvals" ON public.manager_approvals;
DROP POLICY IF EXISTS "Service role can manage" ON public.manager_approvals;
DROP POLICY IF EXISTS "manager_approvals_service_role" ON public.manager_approvals;
DROP POLICY IF EXISTS "manager_approvals_insert_own" ON public.manager_approvals;
DROP POLICY IF EXISTS "manager_approvals_select_own" ON public.manager_approvals;

-- Service role (backend) can do everything
CREATE POLICY "manager_approvals_service_role"
  ON public.manager_approvals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Managers can insert their own approval request
CREATE POLICY "manager_approvals_insert_own"
  ON public.manager_approvals
  FOR INSERT
  WITH CHECK (
    auth.uid() = manager_id 
    OR auth.role() = 'service_role'
  );

-- Managers can view their own approval
CREATE POLICY "manager_approvals_select_own"
  ON public.manager_approvals
  FOR SELECT
  USING (
    auth.uid() = manager_id 
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- FIX: notifications TABLE RLS POLICIES (if it exists)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage" ON public.notifications;
DROP POLICY IF EXISTS "notifications_service_role" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "notifications_service_role"
  ON public.notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anyone can insert notifications
CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users can view their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  USING (
    auth.uid() = recipient_id 
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- VERIFY ALL POLICIES
-- ============================================================================
SELECT 'All RLS policies for registration tables created successfully' as message;
