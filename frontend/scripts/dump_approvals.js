
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpApprovals() {
  console.log("Dumping approvals table...");

  try {
    const { data, error } = await supabase
      .from("approvals")
      .select("*");
    
    if (error) {
        console.log("Error fetching approvals:", error.message);
    } else {
        console.log("Approvals data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("Exception:", e.message);
  }
}

dumpApprovals();
