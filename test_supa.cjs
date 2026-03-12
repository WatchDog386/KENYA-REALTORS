const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  console.log('Testing main query...');
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      id,
      user_id,
      unit_id,
      status,
      units:unit_id(unit_number, price, property_id, properties:property_id(name))
    `)
    .eq('status', 'active');
  
  if (error) {
    console.error('Main query error:', error);
    
    console.log('\nTesting alternative query 1 (without properties)...');
    const { data: d2, error: e2 } = await supabase
      .from('tenants')
      .select(`id, user_id, unit_id, status, units:unit_id(unit_number, price, property_id)`)
      .eq('status', 'active');
    console.error('Alternative 1 error:', e2);
    
    console.log('\nTesting alternative query 2 (inner join syntax)...');
    const { data: d3, error: e3 } = await supabase
      .from('tenants')
      .select(`id, user_id, unit_id, status, units!inner(*)`)
      .eq('status', 'active');
    console.error('Alternative 2 error:', e3);
  } else {
    console.log('Main query SUCCESS! Data count:', data.length);
    console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}
test();