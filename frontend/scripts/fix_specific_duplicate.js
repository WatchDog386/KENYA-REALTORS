
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load env vars from .env file manually if needed, 
// but we'll try to rely on process.env or hardcoded values if we can find them in the codebase.
// For now, let's assume we can execute this in an environment where we can pass the URL and Key, 
// OR we can read from src/integrations/supabase/client.ts or similar if it has them (usually it doesn't have the secret key).
// We need the SERVICE_ROLE_KEY to delete duplicates if RLS is strict, or at least the Anon key if RLS allows.
// However, since we are doing database maintenance, we probably want the Service Role Key.
// CHECK: Does the user have a .env file?
// I'll try to find the project URL and Key from the workspace files.

// I will just use the anon key for now and hope RLS allows me to read/write properly or I'll ask the user (but I should avoid asking).
// Let's check `supabase/config.toml` or `src/vite-env.d.ts` or `src/integrations/supabase/client.ts`.
// Actually, I can use the same values usually found in `hooks/useSupabase.ts` if it exists.

// Let's try to find the Supabase URL and Key in the files first.
// I'll read `src/integrations/supabase/client.ts`
// And `src/App.tsx` sometimes has it or `vite.config.ts` might have env vars.

// Actually, I'll just write a script that assumes `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are available in `process.env` 
// when I run it with `npm run` or similar, or I can parse the `.env` file if it exists.

async function fixDuplicates() {
  console.log("🔍 Checking for tenant duplicates...");
  
  // Try to read .env
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
      try {
          const envPath = path.resolve(__dirname, '../.env');
          if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf8');
              const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
              const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
              if (urlMatch) supabaseUrl = urlMatch[1].trim();
              if (keyMatch) supabaseKey = keyMatch[1].trim();
          }
      } catch (e) {
          console.error("Could not read .env", e);
      }
  }

  if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Could not find Supabase credentials. Please ensure .env file exists or vars are set.");
      // Fallback: Try to find them in the source code using regex if .env failed
      // This is a "hack" to find them if they are hardcoded (unlikely but possible).
      return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // The user ID reported by the user
  const targetUserId = 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';

  const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', targetUserId);

  if (error) {
      console.error("❌ Error fetching tenants:", error);
      return;
  }

  if (!tenants || tenants.length === 0) {
      console.log("⚠️ No tenant records found for this user.");
      return;
  }

  console.log(`✅ Found ${tenants.length} tenant records for user ${targetUserId}`);
  
  if (tenants.length > 1) {
      console.log("⚠️ Duplicates detected! keeping the most recent one...");
      
      // Sort by created_at desc (newest first)
      const sorted = tenants.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);
      
      console.log(`✅ Keeping record ID: ${toKeep.id} (Created: ${toKeep.created_at})`);
      
      for (const t of toDelete) {
          console.log(`🗑️ Deleting duplicate ID: ${t.id} (Created: ${t.created_at})`);
          const { error: delError } = await supabase
              .from('tenants')
              .delete()
              .eq('id', t.id);
              
          if (delError) {
              console.error(`❌ Failed to delete ${t.id}:`, delError);
          } else {
              console.log(`✅ Deleted ${t.id}`);
          }
      }
  } else {
      console.log("✅ No duplicates found for this user. The issue might have been resolved or is elsewhere.");
      console.log("Record:", tenants[0]);
  }
}

fixDuplicates();
