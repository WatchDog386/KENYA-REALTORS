
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Load environment variables (simulated for this script)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rcxmrtqgppayncelonls.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("VITE_SUPABASE_ANON_KEY is missing. Please set it.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking 'units' table structure...");
  
  // We can't directly query schema via rest easily without permissions or specific stored procedures usually.
  // But we can try to select 'unit_type_id' from 'units'.

  const { data, error } = await supabase
    .from('units')
    .select('unit_type_id')
    .limit(1);

  if (error) {
    console.error("Error selecting unit_type_id:", error);
    console.log("This suggests the column might not exist or other permission issues.");
  } else {
    console.log("Successfully selected unit_type_id. Column exists.");
  }

  // Also checking properties of the unit to see what columns are returned if we select *
   const { data: allData, error: allError } = await supabase
    .from('units')
    .select('*')
    .limit(1);
    
    if (allData && allData.length > 0) {
        console.log("Sample unit keys:", Object.keys(allData[0]));
    } else {
        console.log("No units found or error:", allError);
    }
}

checkSchema();
