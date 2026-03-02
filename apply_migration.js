import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcxmrtqgppayncelonls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw'
);

async function applyMigrations() {
  const migrations = [
    "ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS service_fee DECIMAL(12, 2) DEFAULT 0;",
    "ALTER TABLE public.utility_readings DROP COLUMN IF EXISTS total_bill CASCADE;",
    "ALTER TABLE public.utility_readings ADD COLUMN total_bill DECIMAL(12, 2) GENERATED ALWAYS AS (((current_reading - previous_reading) * electricity_rate) + water_bill + garbage_fee + security_fee + service_fee + other_charges) STORED;"
  ];

  for (const sql of migrations) {
    try {
      console.log('Executing:', sql.substring(0, 50) + '...');
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        console.error('✗ Error:', error.message);
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('✗ Exception:', err.message);
    }
  }

  // Wait a moment for cache to refresh
  console.log('\nWaiting for schema cache refresh...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Now test if it works
  console.log('\nTesting service_fee column...');
  try {
    const { error } = await supabase
      .from('utility_readings')
      .insert([{
        unit_id: '00000000-0000-0000-0000-000000000099',
        property_id: '00000000-0000-0000-0000-000000000099',
        reading_month: '2026-02-01',
        service_fee: 0
      }]);

    if (error) {
      if (error.message.includes('service_fee')) {
        console.error('✗ service_fee column still not in schema cache. Please wait a few minutes and retry.');
      } else {
        console.error('✗ Error:', error.message);
      }
    } else {
      console.log('✓ service_fee column is working!');
    }
  } catch (err) {
    console.error('✗ Exception:', err.message);
  }
}

applyMigrations();
