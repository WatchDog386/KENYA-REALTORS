import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function applyFix() {
  const supabase = createClient(supabaseUrl, serviceKey);
  
  console.log('Reading SQL fix...');
  const sqlContent = readFileSync('./FIX_INVOICE_VISIBILITY.sql', 'utf-8');
  
  // Split statements by semicolon, but be careful with multi-line statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    
    try {
      // Use Supabase's queryBuilder to execute raw SQL indirectly
      // Since we can't execute raw SQL directly, we'll try the RPC method
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      
      // Try to detect what type of statement this is
      if (stmt.includes('DROP POLICY')) {
        console.log('  → Dropping policy...');
        const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(e => ({ error: e }));
        if (!error || error?.message?.includes('does not exist')) {
          console.log('  ✓ Success');
          successCount++;
        } else {
          console.log('  ✗ Error:', error?.message || error);
        }
      } else if (stmt.includes('CREATE POLICY')) {
        console.log('  → Creating policy...');
        const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(e => ({ error: e }));
        if (!error) {
          console.log('  ✓ Success');
          successCount++;
        } else {
          console.log('  ✗ Error:', error?.message || error);
        }
      } else if (stmt.includes('UPDATE')) {
        console.log('  → Executing update...');
        const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(e => ({ error: e }));
        if (!error) {
          console.log('  ✓ Success');
          successCount++;
        } else {
          console.log('  ✗ Error:', error?.message || error);
        }
      }
    } catch (e) {
      console.log('  ✗ Exception:', (e as any).message);
    }
  }

  console.log(`\n✓ Applied ${successCount}/${statements.length} statements`);
  console.log('\nIf RPC method is not available, manually run in Supabase SQL Editor:');
  console.log('https://app.supabase.com/project/[project-id]/sql/new');
  console.log('\nPaste the contents of FIX_INVOICE_VISIBILITY.sql and click "Run"');
}

applyFix().catch(console.error);
