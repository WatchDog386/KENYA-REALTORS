
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

// Service Role Key (from your repo)
const SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("🛠️  FORCE ASSIGN TENANT TOOL (Service Role)");
  console.log("-------------------------------------------");
  
  try {
    // 1. Get Tenant Email
    const email = await askQuestion("Enter Tenant Email: ");
    if (!email) throw new Error("Email is required");

    // 2. Find User
    console.log(`\n🔍 Searching for user: ${email}...`);
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    // Simple filter since search logic might vary
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }
    console.log(`✅ Found User: ${user.id}`);

    // 3. Find existing Tenant Record
    console.log("🔍 Checking existing tenant record...");
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tenantError) throw tenantError;

    if (tenant) {
      console.log(`⚠️  Tenant record exists!`);
      console.log(`   Current Property ID: ${tenant.property_id}`);
      console.log(`   Current Unit ID: ${tenant.unit_id}`);
      console.log(`   Status: ${tenant.status}`);
    } else {
      console.log("ℹ️  No existing tenant record found. Creating new one...");
    }

    // 4. Get Target Property and Unit
    const propertyId = await askQuestion("\nEnter Target Property ID: ");
    if (!propertyId) throw new Error("Property ID is required");

    const unitId = await askQuestion("Enter Target Unit ID: ");
    if (!unitId) throw new Error("Unit ID is required");

    // 5. Update or Insert
    const payload = {
      user_id: user.id,
      property_id: propertyId,
      unit_id: unitId,
      status: 'active',
      move_in_date: new Date().toISOString()
    };

    if (tenant) {
      console.log("\n🚀 Updating existing tenant record...");
      const { error: updateError } = await supabase
        .from("tenants")
        .update(payload)
        .eq("id", tenant.id);
      
      if (updateError) throw updateError;
      console.log("✅ Tenant updated successfully!");

    } else {
      console.log("\n🚀 Inserting new tenant record...");
      const { error: insertError } = await supabase
        .from("tenants")
        .insert(payload);
      
      if (insertError) throw insertError;
      console.log("✅ Tenant created successfully!");
    }

    // 6. Handle Lease (Optional)
    const createLease = await askQuestion("\nCreate Lease Record? (y/n): ");
    if (createLease.toLowerCase() === 'y') {
       const rent = await askQuestion("Rent Amount: ");
       const { error: leaseError } = await supabase.from("tenant_leases").insert({
          tenant_id: user.id,
          unit_id: unitId,
          start_date: new Date().toISOString(),
          rent_amount: parseFloat(rent) || 0,
          status: 'active'
       });
       if (leaseError) console.error("❌ Failed to create lease:", leaseError.message);
       else console.log("✅ Lease created.");
    }
    
    // 7. Update Unit Status
    console.log("🔄 Updating Unit status to 'occupied'...");
    const { error: unitError } = await supabase
        .from("units")
        .update({ status: 'occupied' })
        .eq("id", unitId);
    
    if (unitError) console.error("Warning: Failed to update unit status:", unitError.message);
    else console.log("✅ Unit status updated.");

  } catch (error) {
    console.error("\n❌ Error:", error.message || error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
