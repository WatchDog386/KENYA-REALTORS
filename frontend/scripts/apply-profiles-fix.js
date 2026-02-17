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

async function applyFix() {
  try {
    console.log("📦 Reading Profiles RLS fix migration file...");
    const migrationPath = path.join(__dirname, "../database/FIX_PROFILES_RECURSION.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing SQL fix...");

    // Try to use the execute_sql RPC directly
    const { error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
        console.error("❌ Error executing SQL via RPC:", error);
        
        // If RPC execute_sql is missing, we can't run it easily from here without 
        // asking usage of the dashboard.
        // But since other scripts use it, it likely exists.
        process.exit(1);
    } else {
        console.log("✅ SQL executed successfully via RPC!");
    }
    
    console.log("🎉 Profiles RLS policies updated.");
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

applyFix();
