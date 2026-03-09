import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client with service role key (reused from project config)
// Note: This key allows bypassing RLS, which is needed to modify schema if allowed via RPC
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log("📦 Reading Tenant Relationships fix migration file...");
    const migrationPath = path.join(__dirname, "../database/FIX_TENANT_RELATIONSHIPS.sql");
    
    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found at: ${migrationPath}`);
        process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing SQL fix...");
    // Attempt to use 'execute_sql' RPC which is commonly set up for these scripts
    const { error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
        console.error("❌ Error executing SQL via RPC:", error);
        console.log("\n⚠️ AUTOMATED FIX FAILED.");
        console.log("Please run the SQL manually:");
        console.log(`1. Open Supabase Dashboard > SQL Editor`);
        console.log(`2. Paste contents of: database/FIX_TENANT_RELATIONSHIPS.sql`);
        console.log(`3. Run the query.`);
        process.exit(1);
    } 

    console.log("✅ Fix applied successfully! Relationships established.");
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

applyFix();
