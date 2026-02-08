
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

// Service Role Key is required to bypass RLS
const SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log("🛠️  Assign Tenant to a Unit.");
  console.log("-----------------------------------------------");

  try {
    // 1. Get Tenant Email
    const email = await askQuestion("Enter Tenant Email to assign: ");
    if (!email) throw new Error("Email is required");

    // 2. Find User
    console.log(`\n🔍 Searching for user: ${email}...`);
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;

    const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }
    console.log(`✅ Found User: ${user.id} (${user.email})`);

    // 3. Get Property and Unit
    const propertyId = await askQuestion("Enter Property ID: ");
    if (!propertyId) throw new Error("Property ID is required");
    
    const unitId = await askQuestion("Enter Unit ID: ");
    if (!unitId) throw new Error("Unit ID is required");

    // 4. Force Update/Insert Tenant Record
    console.log("\n🚀 Using Service Role to force assignment...");
    
    // Check existing
    const { data: existing } = await supabase.from('tenants').select('id').eq('user_id', user.id).maybeSingle();
    
    let result;
    if (existing) {
         console.log(`ℹ️  Existing tenant record found (${existing.id}). Updating...`);
         result = await supabase.from('tenants').update({
             property_id: propertyId,
             unit_id: unitId,
             status: 'active',
             move_in_date: new Date().toISOString()
         }).eq('id', existing.id);
    } else {
         console.log(`ℹ️  Creating new tenant record...`);
         result = await supabase.from('tenants').insert({
             user_id: user.id,
             property_id: propertyId,
             unit_id: unitId,
             status: 'active',
             move_in_date: new Date().toISOString()
         });
    }

    if (result.error) {
        throw new Error(`Tenant assignment failed: ${result.error.message}`);
    }
    console.log("✅ Tenant record updated/created.");

    // 5. Update Unit Status
    console.log("🔄 Updating unit status...");
    const { error: unitError } = await supabase.from('units').update({ status: 'occupied' }).eq('id', unitId);
    if (unitError) console.warn("⚠️  Failed to update unit status:", unitError.message);
    else console.log("✅ Unit marked as occupied.");

    // 6. Create Lease (Optional)
    const doLease = await askQuestion("\nCreate a lease? (y/n): ");
    if (doLease.toLowerCase().startsWith('y')) {
        const rentStr = await askQuestion("Rent amount: ");
        const rent = parseFloat(rentStr) || 0;
        
        // Deactivate old leases
        await supabase.from('tenant_leases').update({ status: 'terminated' }).eq('unit_id', unitId).eq('status', 'active');
        
        const { error: leaseError } = await supabase.from('tenant_leases').insert({
            tenant_id: user.id,
            unit_id: unitId,
            start_date: new Date().toISOString(),
            rent_amount: rent,
            status: 'active'
        });
        
        if (leaseError) console.error("❌ Lease creation failed:", leaseError.message);
        else console.log("✅ Lease created.");
    }

    console.log("\n🎉 Assignment Complete!");

  } catch (err) {
    console.error("\n❌ Error:", err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
