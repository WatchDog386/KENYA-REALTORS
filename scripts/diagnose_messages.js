
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
    console.log("🔍 Diagnosing Messages...");

    // 1. Get all messages
    const { data: messages, error: msgError } = await supabase
        .from('vacancy_notice_messages')
        .select('*');
    
    if (msgError) {
        console.error("❌ Error fetching messages:", msgError);
        return;
    }

    console.log(`found ${messages.length} messages total.`);
    if (messages.length > 0) {
        console.log("Sample message:", messages[0]);
    } else {
        console.log("⚠️ No messages found in the table. If you tried to send one, the INSERT failed or was rolled back.");
    }

    // 2. Insert a test message as system
    // Find a notice first
    const { data: notices } = await supabase.from('vacancy_notices').select('id, tenant_id').limit(1);
    if (notices && notices.length > 0) {
        const notice = notices[0];
        console.log(`\n📝 Testing INSERT for notice ${notice.id} (Tenant: ${notice.tenant_id})`);
        
        // We can't easily test RLS failure here because we are Service Role (admin).
        // But we can verify the table accepts data.
        /*
        const { data: inserted, error: insertError } = await supabase.from('vacancy_notice_messages').insert({
            vacancy_notice_id: notice.id,
            sender_id: notice.tenant_id,
            message: "System Diagnosis Message"
        }).select();
        
        if (insertError) console.error("Insert failed:", insertError);
        else console.log("Insert success:", inserted);
        */
    } else {
        console.log("No vacancy notices found to attach messages to.");
    }
}

diagnose();
