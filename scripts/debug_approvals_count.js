
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Checking tables...");

  // Check approvals
  try {
    const { count: approvalsCount, error: err1 } = await supabase
      .from("approvals")
      .select("*", { count: "exact", head: true });
    
    if (err1) console.log("Error checking 'approvals':", err1.message);
    else console.log("'approvals' count:", approvalsCount);
  } catch (e) {
    console.log("Exception checking 'approvals':", e.message);
  }

  // Check approval_requests
  try {
    const { count: requestsCount, error: err2 } = await supabase
      .from("approval_requests")
      .select("*", { count: "exact", head: true });
    
    if (err2) console.log("Error checking 'approval_requests':", err2.message);
    else console.log("'approval_requests' count:", requestsCount);
  } catch (e) {
    console.log("Exception checking 'approval_requests':", e.message);
  }
}

checkTables();
