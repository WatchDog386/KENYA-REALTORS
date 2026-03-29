import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function applyFix() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  
  console.log('\n' + '='.repeat(70));
  console.log('INVOICE VISIBILITY FIX');
  console.log('='.repeat(70) + '\n');
  
  console.log('⚠️  Cannot apply RLS policy fix programmatically.');
  console.log('    (Supabase dashboard required for DDL changes)\n');
  
  console.log('✓ Quick Fix - Open Supabase Dashboard:\n');
  console.log(`   Project: ${supabaseUrl}`);
  console.log(`   Navigate to: SQL Editor → New Query\n`);
  
  console.log('✓ Copy & Paste the SQL below:\n');
  console.log('-'.repeat(70));
  
  const sql = readFileSync('./FIX_INVOICE_VISIBILITY.sql', 'utf-8');
  console.log(sql);
  
  console.log('-'.repeat(70));
  console.log('\n✓ Click "Run" button\n');
  console.log('After running, tenants will see their invoices in the portal! ✅\n');
}

applyFix().catch(console.error);
