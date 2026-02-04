
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client with service role key (from apply-user-sync-migration.js)
const supabase = createClient(
  "https://rcxmrtqgppayncelonls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"
);

async function applyFix() {
  try {
    console.log("📦 Reading RLS fix migration file...");
    const migrationPath = path.join(__dirname, "../supabase/migrations/20260211_fix_tenant_rls.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing SQL fix...");

    // Try to use the execute_sql RPC directly
    const { error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
      console.warn("⚠️  Could not run via RPC 'execute_sql'. Error:", error.message);
      console.warn("   (This function might not exist in your database yet)");
      
      console.log("\n📋 Please run the SQL manually:");
      console.log("1. Open Supabase Dashboard");
      console.log("2. SQL Editor -> New Query");
      console.log("3. Paste the content of: supabase/migrations/20260211_fix_tenant_rls.sql");
      console.log("4. Click RUN");
      process.exit(1);
    } 

    console.log("✅ RLS Fix applied successfully via RPC!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

applyFix();
