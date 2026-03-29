import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function executeSql() {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const sqlFile = readFileSync('./FIX_INVOICE_VISIBILITY.sql', 'utf-8');
  
  try {
    // Try to execute via rpc - first check if exec_sql function exists
    console.log('Attempting to execute SQL via Supabase RPC...');
    
    // Split into individual statements
    const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    
    for (const sql of statements) {
      console.log('\nExecuting:', sql.substring(0, 60) + '...');
      
      try {
        const { data, error } = await supabase.rpc('exec', { sql: sql + ';' });
        if (error) {
          console.log('Error:', error.message);
        } else {
          console.log('Success:', data);
        }
      } catch (e) {
        console.log('Exception:', (e).message);
      }
    }
  } catch (e) {
    console.log('Failed to execute via RPC');
    console.log('Error:', (e).message);
    console.log('\nPlease manually run in Supabase SQL Editor:');
    console.log(sqlFile);
  }
}

executeSql();
