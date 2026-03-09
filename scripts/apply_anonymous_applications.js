
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hardcoded per previous scripts
const supabase = createClient(
  "https://rcxmrtqgppayncelonls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"
);

async function applyMigration() {
  try {
    console.log("📦 Reading Anonymous Applications migration file...");
    const migrationPath = path.join(__dirname, "../database/UPDATE_LEASE_APPLICATIONS_ANONYMOUS.sql");
    
    if (!fs.existsSync(migrationPath)) {
        console.error("❌ Migration file not found at:", migrationPath);
        process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing SQL migration...");
    
    // Attempt using `exec_sql` or similar RPC if available
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error("❌ RPC exec_sql failed:", error);
      console.log("⚠️ Attempting fallback via direct SQL if you have psql access. The AI agent cannot run psql directly without setup.");
    } else {
      console.log("✅ Migration applied successfully via RPC!");
    }

  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

applyMigration();
