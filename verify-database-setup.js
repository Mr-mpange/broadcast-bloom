import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Database Setup...\n');
  
  const tables = [
    'contact_messages',
    'audio_content', 
    'play_history',
    'time_slots',
    'broadcast_sessions',
    'user_roles',
    'profiles',
    'shows',
    'favorites'
  ];
  
  let allGood = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allGood = false;
    }
  }
  
  // Check admin users
  console.log('\n👑 Checking Admin Users...');
  try {
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin');
      
    if (adminRoles && adminRoles.length > 0) {
      console.log(`✅ Found ${adminRoles.length} admin user(s)`);
      adminRoles.forEach(role => {
        console.log(`   - Admin User ID: ${role.user_id}`);
      });
    } else {
      console.log('⚠️  No admin users found');
    }
  } catch (err) {
    console.log('❌ Error checking admin users:', err.message);
  }
  
  // Test contact messages
  console.log('\n📧 Testing Contact Messages...');
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Database Test',
        message: 'Testing if contact messages work after setup.'
      }])
      .select();
      
    if (error) {
      console.log('❌ Contact messages test failed:', error.message);
    } else {
      console.log('✅ Contact messages working correctly');
      
      // Clean up test message
      if (data && data[0]) {
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test message cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ Contact messages error:', err.message);
  }
  
  console.log('\n📊 VERIFICATION SUMMARY:');
  if (allGood) {
    console.log('🎉 All database tables are working correctly!');
    console.log('✅ Your app should now run without 404 errors');
    console.log('🚀 Ready to test admin login and contact form');
  } else {
    console.log('⚠️  Some issues found - run the SQL script to fix them');
  }
}

verifyDatabaseSetup().catch(console.error);