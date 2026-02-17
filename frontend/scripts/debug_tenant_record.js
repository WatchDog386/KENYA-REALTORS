
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcxmrtqgppayncelonls.supabase.co';
// Using SERVICE ROLE KEY to bypass RLS
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const targetUserId = 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';

async function debugTenant() {
    console.log(`🔍 Debugging tenant for User ID: ${targetUserId}`);

    // 1. Check Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
    if (profile) {
        console.log(`✅ Profile found: ${profile.first_name} ${profile.last_name} (${profile.email}) - Role: ${profile.role}`);
    } else {
        console.error("❌ No profile found!");
    }

    // 2. Check Tenants Table (ALL records)
    const { data: tenantRecords, error: tError } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', targetUserId);
    
    if (tError) {
        console.error("Error fetching tenants:", tError);
    } else if (tenantRecords.length === 0) {
        console.log("❌ NO records found in 'tenants' table for this user.");
    } else {
        console.log(`✅ Found ${tenantRecords.length} records in 'tenants' table:`);
        tenantRecords.forEach((t, i) => {
            console.log(`   [${i+1}] ID: ${t.id}`);
            console.log(`       Property ID: ${t.property_id}`);
            console.log(`       Unit ID: ${t.unit_id}`);
            console.log(`       Status: '${t.status}'`); // Quote to see whitespace
            console.log(`       Created: ${t.created_at}`);
        });
    }

    // 3. Check Tenant Leases
    const { data: leases } = await supabase
        .from('tenant_leases')
        .select('*')
        .eq('tenant_id', targetUserId);

    if (leases && leases.length > 0) {
        console.log(`✅ Found ${leases.length} lease records:`);
        leases.forEach((l, i) => {
            console.log(`   [${i+1}] ID: ${l.id} - Status: ${l.status}`);
        });
    } else {
        console.log("❌ No lease records found.");
    }
}

debugTenant();
