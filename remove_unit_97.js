import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcxmrtqgppayncelonls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw'
);

async function removeUnit() {
  console.log("Looking up property 'ayden homes pangani'...");
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, name')
    .ilike('name', '%ayden homes pangani%');

  if (propError) {
    console.error("Error fetching property:", propError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log("Could not find property matching 'ayden homes pangani'");
    return;
  }

  const propertyId = properties[0].id;
  console.log(`Found property: ${properties[0].name} (ID: ${propertyId})`);

  console.log("Looking up Unit 97...");
  const { data: units, error: unitError } = await supabase
    .from('units')
    .select('id, unit_number')
    .eq('property_id', propertyId)
    .eq('unit_number', '97');

  if (unitError) {
    console.error("Error fetching unit:", unitError);
    return;
  }

  if (!units || units.length === 0) {
    console.log("Could not find Unit 97 for this property.");
    return;
  }

  const unitId = units[0].id;
  console.log(`Found Unit: ${units[0].unit_number} (ID: ${unitId})`);

  // Pre-emptively clear dependencies
  console.log("Clearing dependencies...");
  await Promise.all([
    supabase.from('tenants').update({ unit_id: null }).eq('unit_id', unitId),
    supabase.from('leases').update({ unit_id: null }).eq('unit_id', unitId),
    supabase.from('utility_readings').delete().eq('unit_id', unitId),
    supabase.from('utilities').delete().eq('unit_id', unitId),
    supabase.from('maintenance_requests').delete().eq('unit_id', unitId),
    supabase.from('rent_payments').delete().eq('unit_id', unitId),
    supabase.from('vacation_notices').delete().eq('unit_id', unitId)
  ]);

  console.log("Deleting Unit...");
  const { error: deleteError } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (deleteError) {
    console.error("Error deleting unit:", deleteError);
  } else {
    console.log("✅ Unit 97 successfully deleted!");
  }
}

removeUnit();