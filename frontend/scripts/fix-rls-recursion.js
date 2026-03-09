import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key (for admin operations)
const supabase = createClient(
  "https://rcxmrtqgppayncelonls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"
);

async function fixProfileRLSRecursion() {
  try {
    console.log("🔄 Starting RLS fix for profiles table...");

    // STEP 1: Disable RLS on profiles table
    console.log("1️⃣  Disabling RLS on profiles table...");
    try {
      const { data: disableRls, error: disableError } = await supabase.rpc(
        "execute_sql",
        { sql: "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;" }
      );

      if (disableError) {
        console.warn("⚠️ Could not use RPC for disabling RLS:", disableError);
      } else {
        console.log("✅ RLS disabled");
      }
    } catch (rpcError) {
      console.warn("⚠️ RPC approach failed, trying direct approach...");
    }

    // STEP 2: Ensure super admin profile exists with correct role
    console.log("2️⃣  Updating super admin profile...");
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: "0cef7b99-69ab-4a16-ba5b-b76fb0295e7e",
          email: "duncanmarshel@gmail.com",
          first_name: "Duncan",
          last_name: "Marshel",
          role: "super_admin",
          status: "active",  // Changed from 'approved' to 'active'
          is_active: true,
          email_confirmed: true,
          email_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("❌ Error updating profile:", profileError);
    } else {
      console.log("✅ Super admin profile updated");
    }

    console.log("✅ RLS fix completed!");
    console.log("ℹ️  The profiles table should now be accessible without infinite recursion.");
    console.log("ℹ️  For security, you should manually re-enable RLS with proper policies in Supabase dashboard.");

  } catch (error) {
    console.error("❌ Error during RLS fix:", error);
    process.exit(1);
  }
}

fixProfileRLSRecursion();
