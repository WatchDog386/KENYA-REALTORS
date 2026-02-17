
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to read from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars. URL:", !!supabaseUrl, "Key:", !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log("Checking tenant_leases columns...");
  
  // Try to select property_id specifically to see if it fails
  const { data, error } = await supabase
    .from('tenant_leases')
    .select('property_id')
    .limit(1);

  if (error) {
    console.error("Error fetching property_id:", error.message);
  } else {
    console.log("Success fetching property_id. Data:", data);
  }

  // Also check all columns
  const { data: allData, error: allError } = await supabase
    .from('tenant_leases')
    .select('*')
    .limit(1);
    
  if (allError) {
      console.error("Error fetching *:", allError.message);
  } else {
      console.log("Available columns:", allData && allData.length > 0 ? Object.keys(allData[0]) : "No rows");
  }
}

checkColumns();
