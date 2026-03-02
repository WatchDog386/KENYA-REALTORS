import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcxmrtqgppayncelonls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw'
);

async function verify() {
  // Test creating a reading with service_fee
  const testPayload = {
    unit_id: '00000000-0000-0000-0000-000000000001',
    property_id: '00000000-0000-0000-0000-000000000001',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    reading_month: '2026-02-01',
    previous_reading: 100,
    current_reading: 150,
    electricity_rate: 140,
    water_bill: 500,
    garbage_fee: 100,
    security_fee: 200,
    service_fee: 300,
    other_charges: 50,
    status: 'pending',
  };

  try {
    const { error, data } = await supabase
      .from('utility_readings')
      .insert([testPayload])
      .select();

    if (error) {
      console.error('✗ Error:', error.message);
    } else {
      console.log('✓ Successfully inserted reading with service_fee');
      console.log('Data:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('✗ Exception:', err.message);
  }
}

verify();
