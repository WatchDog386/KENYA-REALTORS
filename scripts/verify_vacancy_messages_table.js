
import { createClient } from "@supabase/supabase-js";

// Configuration from context (using Service Key from earlier check)
const SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTable() {
    console.log("Checking vacancy_notice_messages table...");
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase.from('vacancy_notice_messages').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error("❌ Error accessing table:", error.message);
        if (error.code === '42P01') { // undefined_table
            console.log("👉 The table DOES NOT exist. You MUST run the SQL script.");
        } else {
            console.log("👉 The table might exist but there's a permission or other error.");
        }
    } else {
        console.log("✅ Table exists!");
        
        // Check policies? Hard via API.
        // We'll just assume they need to update them if they report issues.
    }
}

checkTable();
