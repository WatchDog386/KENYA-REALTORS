import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcxmrtqgppayncelonls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw'
);

async function run() {
  const { data } = await supabase.from('property_unit_types').select('name');
  console.log([...new Set(data?.map(d => d.name))]);
}
run();