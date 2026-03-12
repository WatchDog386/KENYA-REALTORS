require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      id,
      user_id,
      unit_id,
      status,
      profiles:user_id(first_name, last_name, email, phone)
    `)
    .limit(1);
  console.log('Error:', error);
}

run();