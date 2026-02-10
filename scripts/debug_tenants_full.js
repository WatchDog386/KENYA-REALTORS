
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTenants() {
  console.log("🔍 Debugging Tenants Data...");

  // 1. Fetch ALL tenants (Service Role)
  const { data: allTenants, error } = await supabase
    .from('tenants')
    .select('*');

  if (error) {
    console.error("❌ Error fetching tenants:", error);
    return;
  }

  console.log(`✅ Found ${allTenants.length} tenants in the database (Service Role view).`);

  if (allTenants.length === 0) {
      console.log("⚠️ No tenants found. Exiting.");
      return;
  }

  console.table(allTenants.map(t => ({
      id: t.id.substring(0, 8) + '...',
      user_id: t.user_id,
      property_id: t.property_id,
      unit_id: t.unit_id,
      status: t.status
  })));

  // 2. Check Relationships
  console.log("\n🔍 Checking Relationships...");

  for (const t of allTenants) {
      console.log(`\nChecking Tenant ${t.id}...`);
      
      // Check Profile
      if (t.user_id) {
          const { data: profile } = await supabase.from('profiles').select('id, email, role').eq('id', t.user_id).single();
          console.log(`  - User/Profile (${t.user_id}): ${profile ? `✅ Found (${profile.email}, ${profile.role})` : '❌ NOT FOUND'}`);
      } else {
          console.log(`  - User/Profile: ⚠️ NULL`);
      }

      // Check Property
      if (t.property_id) {
          const { data: property } = await supabase.from('properties').select('id, name').eq('id', t.property_id).single();
          console.log(`  - Property (${t.property_id}): ${property ? `✅ Found (${property.name})` : '❌ NOT FOUND'}`);
      } else {
          console.log(`  - Property: ⚠️ NULL`);
      }

      // Check Unit
      if (t.unit_id) {
          const { data: unit } = await supabase.from('units').select('id, unit_number').eq('id', t.unit_id).single();
          console.log(`  - Unit (${t.unit_id}): ${unit ? `✅ Found (${unit.unit_number})` : '❌ NOT FOUND'}`);
      } else {
          console.log(`  - Unit: ⚠️ NULL`);
      }
  }

  console.log("\n✅ Debugging complete.");
}

debugTenants();
