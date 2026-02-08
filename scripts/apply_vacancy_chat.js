
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration from existing scripts
const SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    const migrationFile = "UPDATE_VACANCY_NOTICES_CHAT.sql";
    console.log(`📦 Reading ${migrationFile}...`);
    const migrationPath = path.join(__dirname, `../database/${migrationFile}`);
    
    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ File not found: ${migrationPath}`);
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Executing SQL migration...");

    // Try to use the execute_sql RPC directly
    const { error } = await supabase.rpc("execute_sql", {
      sql: migrationSQL
    });

    if (error) {
      console.warn("⚠️  Could not run via RPC 'execute_sql'. Error:", error.message);
      console.warn("   Trying fallback to manual instructions...");
      
      console.log("\n📋 Please run the SQL manually:");
      console.log("1. Open Supabase Dashboard");
      console.log("2. SQL Editor -> New Query");
      console.log(`3. Paste the content of: database/${migrationFile}`);
      console.log("4. Click RUN");
      process.exit(1);
    } 

    console.log(`✅ ${migrationFile} applied successfully!`);
    
  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

applyMigration();
