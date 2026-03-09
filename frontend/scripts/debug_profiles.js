
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfiles() {
  console.log("🔍 Debugging Profiles...");

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Error fetching profiles:", error);
    return;
  }

  console.log(`✅ Found ${profiles.length} total profiles.`);
  
  // Group by role
  const byRole = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
  }, {});
  
  console.log("📊 Breakdown by Role:", byRole);

  const tenantProfiles = profiles.filter(p => p.role === 'tenant');
  console.log(`\n📋 Listing ${tenantProfiles.length} Tenant Profiles:`);
  console.table(tenantProfiles.map(p => ({
      email: p.email,
      role: p.role, 
      name: `${p.first_name} ${p.last_name}`,
      id: p.id
  })));
  
  // Check which of these have a corresponding record in 'tenants' table
  console.log("\n🔍 Checking for matching 'tenants' records...");
  
  for (const p of tenantProfiles) {
      const { data: tenantRecord } = await supabase.from('tenants').select('id, property_id, unit_id').eq('user_id', p.id).single();
      if (tenantRecord) {
          console.log(`  ✅ ${p.email} -> Tenant Record ID: ${tenantRecord.id} (Prop: ${tenantRecord.property_id || 'None'}, Unit: ${tenantRecord.unit_id || 'None'})`);
      } else {
          console.log(`  ❌ ${p.email} -> NO TENANT RECORD FOUND`);
      }
  }

}

debugProfiles();
