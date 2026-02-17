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
    console.log("📦 Reading unit details migration file...");
    const migrationPath = path.join(__dirname, "../supabase/migrations/20260207_add_unit_details.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing migration...");

    // Execute the entire migration as one statement
    // Note: This relies on a potentially existing 'execute_sql' RPC. 
    // If it fails, we might need a fallback or assume it works as per previous scripts.
    const { data, error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
      // If execute_sql is not found or fails, try direct query if possible (usually not allowed for DDL via client)
      // But let's report error.
      console.error("❌ Migration execution failed:", error);
      process.exit(1);
    }

    console.log("✅ Migration completed successfully! Added columns to units table.");
    
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

applyMigration();
