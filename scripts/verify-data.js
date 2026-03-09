import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcxmrtqgppayncelonls.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyData() {
  try {
    console.log('🔍 Checking current data in your database...\n');

    // Check property managers
    const { data: managers, error: mgError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'property_manager');
    
    if (mgError) {
      console.error('❌ Error fetching managers:', mgError.message);
    } else {
      console.log('✅ Property Managers:');
      if (managers && managers.length > 0) {
        managers.forEach(m => console.log(`   - ${m.email} (ID: ${m.id})`));
      } else {
        console.log('   ⚠️  No property managers found');
      }
    }

    // Check tenants
    const { data: tenants, error: tError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'tenant');
    
    if (tError) {
      console.error('❌ Error fetching tenants:', tError.message);
    } else {
      console.log('\n✅ Tenants:');
      if (tenants && tenants.length > 0) {
        tenants.forEach(t => console.log(`   - ${t.email} (ID: ${t.id})`));
      } else {
        console.log('   ⚠️  No tenants found');
      }
    }

    // Check properties
    const { data: properties, error: pError } = await supabase
      .from('properties')
      .select('id, name, address');
    
    if (pError) {
      console.error('❌ Error fetching properties:', pError.message);
    } else {
      console.log('\n✅ Properties:');
      if (properties && properties.length > 0) {
        properties.forEach(p => console.log(`   - ${p.name} at ${p.address} (ID: ${p.id})`));
      } else {
        console.log('   ⚠️  No properties found');
      }
    }

    // Check existing assignments
    const { data: assignments, error: aError } = await supabase
      .from('property_manager_assignments')
      .select('*');
    
    if (!aError && assignments) {
      console.log(`\n✅ Property Manager Assignments: ${assignments.length} found`);
    }

    // Check units
    const { data: units, error: uError } = await supabase
      .from('units')
      .select('id, property_id, unit_number');
    
    if (!uError && units) {
      console.log(`✅ Units: ${units.length} found`);
      if (units.length > 0) {
        units.slice(0, 5).forEach(u => console.log(`   - Unit ${u.unit_number} (Property: ${u.property_id})`));
      }
    }

    // Check tenant assignments
    const { data: tenantAssignments, error: taError } = await supabase
      .from('tenants')
      .select('user_id, unit_id, property_id');
    
    if (!taError && tenantAssignments) {
      console.log(`✅ Tenant Assignments: ${tenantAssignments.length} found`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('To execute the assignment, you need to:');
    console.log('1. Go to https://app.supabase.com/project/rcxmrtqgppayncelonls');
    console.log('2. Open the SQL Editor');
    console.log('3. Paste the content from: database/ASSIGN_TENANTS_AND_MANAGER.sql');
    console.log('4. Run the script');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run the verification
verifyData();
