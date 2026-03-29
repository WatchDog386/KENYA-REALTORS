const { Client } = require('pg');
require('dotenv').config();

async function applyFix() {
  // Supabase PostgreSQL connection
  // Format: postgres://postgres:password@subdomain.supabase.co:5432/postgres
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // Extract subdomain from URL: https://rcxmrtqgppayncelonls.supabase.co
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  
  if (!projectId) {
    console.log('Cannot extract project ID from Supabase URL');
    console.log('Please manually run the SQL fix via Supabase Dashboard:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Open SQL Editor');
    console.log('3. Copy contents of FIX_INVOICE_VISIBILITY.sql');
    console.log('4. Click Run');
    return;
  }

  // Try to use the PostgreSQL connection
  // Note: This requires the correct password, which isn't stored in .env
  console.log('Note: Direct DB connection requires PostgreSQL password from Supabase project settings.');
  console.log('      Using service role key won\'t work with pg client (needs password).');
  console.log('\n✓ Please use Supabase Dashboard SQL Editor instead:');
  console.log('\n  1. Go to: https://app.supabase.com');
  console.log('  2. Select your project');
  console.log('  3. Click "SQL Editor" → "New Query"');
  console.log('  4. Paste FIX_INVOICE_VISIBILITY.sql');
  console.log('  5. Click "Run"\n');
  
  // Display the SQL that needs to be run
  const fs = require('fs');
  const sql = fs.readFileSync('./FIX_INVOICE_VISIBILITY.sql', 'utf-8');
  console.log('SQL to execute:\n' + '='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
}

applyFix().catch(console.error);
