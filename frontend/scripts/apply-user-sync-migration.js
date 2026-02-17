import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client with service role key
const supabase = createClient(
  "https://rcxmrtqgppayncelonls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"
);

async function applyMigration() {
  try {
    console.log("📦 Reading migration file...");
    const migrationPath = path.join(__dirname, "../supabase/migrations/20260205_enhance_user_sync.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing migration...\n");

    // Execute the entire migration as one statement
    const { data, error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
      console.error("❌ Migration execution failed:", error);
      console.log("\n📋 Manual Steps:");
      console.log("1. Visit: https://rcxmrtqgppayncelonls.supabase.co");
      console.log("2. Go to SQL Editor");
      console.log("3. Copy and paste the migration from: supabase/migrations/20260205_enhance_user_sync.sql");
      console.log("4. Click 'Execute' to run the migration");
      process.exit(1);
    }

    console.log("✅ Migration completed successfully!");
    console.log("\n📋 What was applied:");
    console.log("✅ Enhanced handle_new_user() function for syncing auth users to profiles");
    console.log("✅ Trigger on_auth_user_created for automatic profile creation on signup");
    console.log("✅ Sync of all existing auth.users to profiles table");
    console.log("✅ Super admin role assigned to duncanmarshel@gmail.com");
    console.log("✅ get_all_users_with_auth() function for dashboard queries");
    console.log("✅ RLS policies updated for super admin full visibility");

    // Verify super admin
    console.log("\n🔍 Verifying super admin setup...");
    const { data: adminProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "duncanmarshel@gmail.com")
      .single();

    if (verifyError) {
      console.warn("⚠️ Could not verify super admin:", verifyError.message);
    } else {
      console.log("✅ Super admin verified:");
      console.log(`   Email: ${adminProfile.email}`);
      console.log(`   Role: ${adminProfile.role}`);
      console.log(`   Status: ${adminProfile.status}`);
      console.log(`   Active: ${adminProfile.is_active}`);
    }

    console.log("\n✨ User sync enhancement is ready!");
    console.log("Users will now automatically sync from auth.users to profiles table on signup.");

  } catch (error) {
    console.error("❌ Script error:", error.message);
    process.exit(1);
  }
}

applyMigration();
