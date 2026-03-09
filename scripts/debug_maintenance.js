
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

let env = {};
try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('Could not read .env file', e);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMaintenance() {
  console.log('--- Debugging Maintenance Visibility ---');

  // 1. Find Manager Felix
  const { data: managers, error: managerError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .ilike('first_name', '%Felix%')
    .ilike('last_name', '%Ochieng%');

  if (managerError) {
    console.error('Error finding manager:', managerError);
    return;
  }

  if (managers.length === 0) {
    console.log('No manager found with name Felix Ochieng');
  } else {
    console.log('Found Manager(s):');
    managers.forEach(m => console.log(`- ${m.first_name} ${m.last_name} (${m.id})`));
  }
  
  const managerId = managers[0]?.id;

  // 2. Check Property Assignments for Manager
  if (managerId) {
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id, properties(name)')
        .eq('property_manager_id', managerId);

      if (assignError) {
          console.error('Error fetching assignments:', assignError);
      } else {
          console.log('\nProperty Assignments for Felix:');
          if (assignments.length === 0) console.log('No properties assigned.');
          assignments.forEach(a => console.log(`- Property ID: ${a.property_id} Name: ${a.properties?.name}`));
      }
  }

  // 3. List Recent Maintenance Requests
  console.log('\nRecent Maintenance Requests (No Join):');
  const { data: requests, error: reqError } = await supabase
    .from('maintenance_requests')
    .select('*');

  if (reqError) {
    console.error('Error fetching requests:', reqError);
  } else {
      console.log(`Found ${requests.length} requests.`);
      requests.forEach(r => console.log(JSON.stringify(r)));
  }
}

debugMaintenance();
