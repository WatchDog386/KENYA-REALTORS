
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log("🔍 Probing detailed columns for lease_applications...");

  const potentialColumns = [
      'notes',
      'message', 
      'income',
      'employment_status',
      'move_in_date',
      'lease_term',
      'documents'
  ];
  
  for (const col of potentialColumns) {
      const { error } = await supabase.from('lease_applications').select(col).limit(1);
      if (!error) {
          console.log(`✅ ${col}: Exists`);
      } else {
          // console.log(`❌ ${col}: ${error.message}`);
      }
  }
}

inspectTable();
