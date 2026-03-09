
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
// Using the service role key from dump_approvals.js
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOwner() {
  console.log("Checking owner of approval requests...");
  const userId = '11859d1b-d278-402c-84bf-772e6530e815';

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, role")
      .eq("id", userId)
      .single();
    
    if (error) {
        console.log("Error fetching profile:", error.message);
    } else {
        console.log("Owner Profile:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log("Exception:", e.message);
  }
}

checkOwner();
