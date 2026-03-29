import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function verify() {
  console.log('Testing with ANON key (frontend):');
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const tid = '8412a687-23c1-4ca3-bb9d-1cf560f45772';
  const { data: invs, error } = await anonClient
    .from('invoices')
    .select('id, amount, status, notes')
    .eq('tenant_id', tid);

  console.log('Error:', error?.message || 'None');
  console.log('Results:', invs?.length || 0);
  if (invs && invs.length > 0) {
    console.log('✓ Invoice IS visible through anon key!');
    console.log('  Invoice ID:', invs[0].id);
  } else {
    console.log('✗ Invoice still NOT visible through anon key');
  }

  console.log('\nChecking RLS policies:');
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: policies } = await serviceClient
    .from('information_schema.role_table_grants')
    .select('*')
    .eq('table_name', 'invoices')
    .limit(5);

  console.log('Policies query result:', policies?.length || 0);
}

verify().catch(console.error);
