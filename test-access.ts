import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function testAnonAccess() {
  const tid = '8412a687-23c1-4ca3-bb9d-1cf560f45772'; // Caleb

  // Simulate what the frontend does: set auth session to this user
  const { data: testData, error: authError } = await supabase.auth.getSession();
  console.log('Current session:', testData);

  // Try to query invoices directly
  const { data: invs, error } = await supabase
    .from('invoices')
    .select('id, amount, status, notes')
    .eq('tenant_id', tid);

  console.log('Query error:', error);
  console.log('Query results count:', invs?.length || 0);
  if (invs && invs.length > 0) {
    console.log('First invoice notes:', invs[0].notes?.substring(0, 100));
  }
}

testAnonAccess().catch(console.error);
