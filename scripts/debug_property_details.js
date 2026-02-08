
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';

async function checkDetails() {
  console.log("Checking active lease...");
  const { data: lease, error: leaseErrors } = await supabase
    .from('tenant_leases')
    .select('*')
    .eq('tenant_id', USER_ID)
    .eq('status', 'active')
    .maybeSingle();

  if (lease) {
      console.log('Lease found:', lease);
      // Check for rent_amount specifically
      console.log('Rent Amount:', lease.rent_amount);
  } else {
      console.log('No active lease found', leaseErrors);
  }

  if (lease && lease.unit_id) {
    // Get property from unit
    const { data: unit } = await supabase.from('units').select('property_id').eq('id', lease.unit_id).single();
    
    if (unit && unit.property_id) {
        console.log('Property ID:', unit.property_id);
        const { data: prop } = await supabase
            .from('properties')
            .select('*')
            .eq('id', unit.property_id)
            .single();
        console.log('Property:', prop);
    }
  }
}

checkDetails();
