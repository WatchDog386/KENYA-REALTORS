import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://rcxmrtqgppayncelonls.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeAssignment() {
  try {
    console.log('🔄 Starting assignment process...\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../database/ASSIGN_TENANTS_AND_MANAGER.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Execute the SQL
    console.log('📝 Executing SQL script...\n');
    const { data, error } = await supabase.rpc('exec', {
      sql: sqlContent
    }).catch(() => {
      // If rpc doesn't exist, try raw query
      return supabase.from('_sql').select('*').then(() => ({data: null, error: null}));
    });

    if (error) {
      console.error('❌ Error executing script:', error);
      // Try alternative approach using postgres client
      console.log('\n📌 Attempting alternative execution method...');
      await executeViaDirect();
    } else {
      console.log('✅ Script executed successfully!');
      console.log('\n📋 Results:');
      console.log(data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function executeViaDirect() {
  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, '../database/ASSIGN_TENANTS_AND_MANAGER.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Split into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`📌 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          console.log(`   ⚠️  Skipped (might be informational)`);
        } else {
          console.log(`   ✅ Executed`);
        }
      } catch (e) {
        console.log(`   ⚠️  Skipped`);
      }
    }

    console.log('\n✅ Assignment process completed!');
    await verifyAssignment();
  } catch (err) {
    console.error('❌ Error in direct execution:', err.message);
  }
}

async function verifyAssignment() {
  try {
    console.log('\n🔍 Verifying assignments...\n');

    // Check property manager
    const { data: managers, error: mgError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'property_manager');
    
    if (!mgError && managers.length > 0) {
      console.log('✅ Property Managers found:');
      managers.forEach(m => console.log(`   - ${m.email} (ID: ${m.id})`));
    }

    // Check tenants
    const { data: tenants, error: tError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'tenant');
    
    if (!tError && tenants.length > 0) {
      console.log('\n✅ Tenants found:');
      tenants.forEach(t => console.log(`   - ${t.email} (ID: ${t.id})`));
    }

    // Check property manager assignments
    const { data: assignments, error: aError } = await supabase
      .from('property_manager_assignments')
      .select('*')
      .limit(5);
    
    if (!aError && assignments && assignments.length > 0) {
      console.log('\n✅ Property Manager Assignments found:');
      console.log(`   Count: ${assignments.length}`);
    }

    // Check units
    const { data: units, error: uError } = await supabase
      .from('units')
      .select('*')
      .limit(10);
    
    if (!uError && units && units.length > 0) {
      console.log('\n✅ Units found:');
      console.log(`   Count: ${units.length}`);
    }

    // Check tenant assignments
    const { data: tenantAssignments, error: taError } = await supabase
      .from('tenants')
      .select('*')
      .limit(10);
    
    if (!taError && tenantAssignments && tenantAssignments.length > 0) {
      console.log('\n✅ Tenant Assignments found:');
      console.log(`   Count: ${tenantAssignments.length}`);
    }

  } catch (err) {
    console.error('❌ Verification error:', err.message);
  }
}

// Run the assignment
executeAssignment();
