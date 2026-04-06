import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, serviceKey);

async function checkRLS() {
  // Query the RLS policies on invoices table
  const { data, error } = await adminClient.rpc('get_rls_policies', {
    table_name: 'invoices'
  }).catch(() => ({ data: null, error: 'RPC not available' }));
  
  if (error) {
    console.log('Cannot query RLS via RPC - will check via SQL instead');
  } else {
    console.log('RLS Policies:', data);
  }

  // Try direct query of pg_policies
  const { data: policies, error: polError } = await adminClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'invoices');

  console.log('Direct table query result:', policies);
}

checkRLS().catch(console.error);
