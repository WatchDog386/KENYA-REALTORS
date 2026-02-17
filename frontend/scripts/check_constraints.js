
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
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('--- Checking Maintenance Table Constraints ---');

  // Check properties specifically
  const { error } = await supabase
    .from('maintenance_requests')
    .select(`
        id,
        properties!fk_maintenance_properties(name)
    `)
    .limit(1);

  if (error) {
      console.log('❌ Property Check Failed:', error.message);
      if (error.code === 'PGRST201') {
          console.log('Ambiguity confirmed for Properties too.');
      }
  } else {
      console.log('✅ Property relationship works with explicit name!');
  }
}

checkConstraints();
