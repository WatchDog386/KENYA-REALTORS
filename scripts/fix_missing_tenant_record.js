
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcxmrtqgppayncelonls.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const targetUserId = 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';

async function fixMissingTenantRecord() {
    console.log(`🔧 Fixing missing tenant record for User ID: ${targetUserId}`);

    // 1. Get the active lease
    const { data: leases, error: lError } = await supabase
        .from('tenant_leases')
        .select('*')
        .eq('tenant_id', targetUserId)
        .eq('status', 'active')
        .maybeSingle();

    if (lError) {
        console.error("❌ Error fetching lease:", lError);
        return;
    }

    if (!leases) {
        console.log("❌ No active lease found. Cannot restore tenant record without a lease source.");
        return;
    }

    console.log(`✅ Found active lease: ${leases.id} for Unit ID: ${leases.unit_id}`);

    // 2. Get Unit details to find Property ID
    const { data: unit, error: uError } = await supabase
        .from('units')
        .select('property_id')
        .eq('id', leases.unit_id)
        .single();
    
    if (uError || !unit) {
        console.error("❌ Could not find unit details:", uError);
        return;
    }
    
    console.log(`✅ Unit belongs to Property ID: ${unit.property_id}`);

    // 3. Create the missing tenant record
    const { data: newTenant, error: iError } = await supabase
        .from('tenants')
        .insert({
            user_id: targetUserId,
            property_id: unit.property_id,
            unit_id: leases.unit_id,
            status: 'active',
            move_in_date: leases.start_date || new Date().toISOString()
        })
        .select()
        .single();

    if (iError) {
        console.error("❌ Failed to create tenant record:", iError);
    } else {
        console.log("✅ Successfully created missing tenant record!");
        console.log(newTenant);
    }
}

fixMissingTenantRecord();
