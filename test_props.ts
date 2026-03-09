import dotenv from 'dotenv'; dotenv.config(); import { supabase } from './src/integrations/supabase/client'; supabase.from('properties').select('*').limit(1).then(r => console.log(r));
