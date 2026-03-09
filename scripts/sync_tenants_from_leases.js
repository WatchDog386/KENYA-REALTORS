
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTenants() {
  console.log("🔄 Syncing Tenants from Active Leases...");

  // 1. Get all active leases with unit and property info
  const { data: leases, error: leasesError } = await supabase
    .from('tenant_leases')
    .select(`
        tenant_id,
        unit_id,
        start_date,
        end_date,
        units (
            id,
            property_id
        )
    `)
    .eq('status', 'active');

  if (leasesError) {
      console.error("❌ Error fetching leases:", leasesError);
      return;
  }

  console.log(`Found ${leases.length} active leases.`);

  // 2. Process each lease
  for (const lease of leases) {
      const userId = lease.tenant_id;
      const unitId = lease.unit_id;
      // @ts-ignore
      const propertyId = lease.units?.property_id;

      if (!propertyId) {
          console.warn(`⚠️ Lease for user ${userId} has no property linked to unit ${unitId}. Skipping.`);
          continue;
      }

      // 3. Check if tenant record exists
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId) // Tenant record is unique per property usually
        .single();

      if (!existing) {
          console.log(`➕ Creating missing tenant record for User: ${userId} (Prop: ${propertyId})...`);
          
          const { error: insertError } = await supabase
            .from('tenants')
            .insert({
                user_id: userId,
                property_id: propertyId,
                unit_id: unitId,
                status: 'active',
                move_in_date: lease.start_date
            });

          if (insertError) {
              console.error(`   ❌ Failed to insert:`, insertError);
          } else {
              console.log(`   ✅ Inserted successfully.`);
          }
      } else {
          console.log(`✓ Tenant record exists for User: ${userId}`);
      }
  }
  
  console.log("\n✨ Sync complete.");
}

syncTenants();
