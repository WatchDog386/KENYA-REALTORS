
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log('Fetching units for Ayden...');
  const { data, error } = await supabase
    .from('units')
    .select('id, unit_number')
    .eq('property_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    .limit(5);
  if (error) console.error(error);
  else console.table(data);
}

inspect();

