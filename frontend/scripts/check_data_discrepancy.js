
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiscrepancy() {
  console.log("🔍 Checking Data Discrepancy...");

  // 1. Fetch Tenant Leases (Source of Truth for ManagerPortal)
  const { data: leases } = await supabase
    .from('tenant_leases')
    .select('tenant_id, status, unit_id, start_date, end_date')
    .eq('status', 'active');
    
  console.log(`\n📄 Active Leases (Manager Portal Source): ${leases?.length || 0}`);
  if (leases) {
      // Get unique tenant_ids (user_ids)
      const uniqueTenants = [...new Set(leases.map(l => l.tenant_id))];
      console.log(`   Unique Tenants in Leases: ${uniqueTenants.length}`);
      
      // Fetch names for context
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', uniqueTenants);
      
      uniqueTenants.forEach(uid => {
          const profile = profiles?.find(p => p.id === uid);
          const lease = leases.find(l => l.tenant_id === uid);
          console.log(`   - ${profile?.email || uid} (Unit: ${lease?.unit_id})`);
      });

      // 2. Fetch Tenants Table (LeasesManagement Source)
      const { data: tenantRecords } = await supabase.from('tenants').select('id, user_id, status');
      console.log(`\n📋 Tenants Table Records: ${tenantRecords?.length || 0}`);
      
      tenantRecords?.forEach(t => {
         const profile = profiles?.find(p => p.id === t.user_id); 
         console.log(`   - ${profile?.email || t.user_id} (Status: ${t.status})`);
      });

      // 3. Find Missing
      console.log("\n⚠️ Missing from 'tenants' table:");
      const existingUserIds = tenantRecords?.map(t => t.user_id) || [];
      const missing = uniqueTenants.filter(uid => !existingUserIds.includes(uid));
      
      if (missing.length === 0) {
          console.log("   None! Data is in sync.");
      } else {
          missing.forEach(uid => {
               const profile = profiles?.find(p => p.id === uid);
               console.log(`   ❌ MISSING: ${profile?.email || uid}`);
          });
      }
  }
}

checkDiscrepancy();
