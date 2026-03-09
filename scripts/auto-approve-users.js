import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcxmrtqgppayncelonls.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function autoApproveUsers() {
  try {
    console.log('🔄 Starting auto-approval process...\n');

    // First, check current pending users
    const { data: pendingUsers } = await supabase
      .from('profiles')
      .select('id, email, role, status, approved')
      .eq('status', 'pending');

    if (pendingUsers && pendingUsers.length > 0) {
      console.log('📋 Found pending users:');
      pendingUsers.forEach(u => 
        console.log(`   - ${u.email} (${u.role}) - Status: ${u.status}`)
      );
    } else {
      console.log('✅ No pending users found - all users are already approved!');
    }

    // Auto-approve all pending users
    console.log('\n✨ Auto-approving all pending users...');
    const { data, error } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        approved: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .eq('approved', false);

    if (error) {
      console.error('❌ Error during auto-approval:', error.message);
    } else {
      console.log('✅ Auto-approval completed successfully!\n');
    }

    // Show final status
    console.log('📊 Final User Status:\n');
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, email, role, status, approved, is_active')
      .order('created_at', { ascending: false });

    if (allUsers && allUsers.length > 0) {
      console.log(`Total Users: ${allUsers.length}`);
      console.log('\nUser Details:');
      allUsers.forEach(u => {
        const statusEmoji = u.status === 'active' ? '✅' : '⏳';
        const approvedEmoji = u.approved ? '✔️' : '✗';
        console.log(`${statusEmoji} ${u.email}`);
        console.log(`   Role: ${u.role} | Status: ${u.status} | Approved: ${approvedEmoji} | Active: ${u.is_active}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All users can now login without pending approval!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run the auto-approval
autoApproveUsers();
