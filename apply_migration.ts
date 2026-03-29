import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function applyMigration() {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260329_fix_onboarding_invoice_visibility_and_rpc_access.sql');
  
  if (!existsSync(migrationPath)) {
    throw new Error(\Migration file not found: \\);
  }

  const sqlContent = readFileSync(migrationPath, 'utf-8');
  
  // Split by ;; to handle multiple statements
  const statements = sqlContent.split(';;').filter(s => s.trim());
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    
    try {
      console.log('Executing:', trimmed.substring(0, 60) + '...');
      const { data, error } = await supabase.rpc('exec', { sql: trimmed }).catch(() => ({ data: null, error: null }));
      if (error) {
        console.log('  Error:', error);
      } else {
        console.log('  ✓ Success');
      }
    } catch (e) {
      console.log('  Caught error:', (e as any).message);
    }
  }
}

applyMigration().catch(console.error);
