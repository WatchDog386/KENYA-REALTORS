import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
const supabase = createClient(
  "https://rcxmrtqgppayncelonls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"
);

async function applyMigration() {
  console.log("📦 Reading image_url migration file...");
  const migrationPath = path.join(__dirname, "../supabase/migrations/20260218_add_image_to_units.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("🚀 Executing migration...");

  // Try multiple RPC function names
  const rpcNames = ["execute_sql", "exec", "exec_sql", "execute"];
  
  for (const rpcName of rpcNames) {
    console.log(`Trying RPC function: ${rpcName}...`);
    try {
        const { data, error } = await supabase.rpc(rpcName, { sql: migrationSQL });
        
        if (!error) {
            console.log(`✅ Migration completed successfully using ${rpcName}!`);
            return;
        } else {
            console.log(`   Error for ${rpcName}: [${error.code}] ${error.message}`);
        }
    } catch (e) {
        console.log(`   Exception calling ${rpcName}:`, e.message);
    }
  }
  
  console.error("❌ Failed to execute migration with any known RPC function.");
  process.exit(1);
}

applyMigration();
