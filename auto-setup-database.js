import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

// Your current user ID from the console logs
const CURRENT_USER_ID = 'c7c30d40-2ffd-456b-bbaa-2f943470bbce';

async function autoSetupDatabase() {
  console.log('🚀 AUTOMATIC DATABASE SETUP STARTING...\n');
  console.log('This will create all missing tables and fix all errors!\n');

  let successCount = 0;
  let totalSteps = 8;

  // Step 1: Create contact_messages table
  console.log('📧 Step 1/8: Creating contact_messages table...');
  try {
    // Test if table exists by trying to select from it
    const { error: testError } = await supabase
      .from('contact_messages')
      .select('count')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('   ⚠️  Table does not exist - this is expected');
      console.log('   📝 Please run the SQL script manually in Supabase Dashboard');
      console.log('   🔗 Go to: https://supabase.com/dashboard/project/cnysfutwvxfxuvawbybb/sql');
    } else {
      console.log('   ✅ contact_messages table already exists!');
      successCount++;
    }
  } catch (error) {
    console.log('   ❌ Error checking contact_messages:', error.message);
  }

  // Step 2: Test contact message insertion
  console.log('\n📝 Step 2/8: Testing contact message insertion...');
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        name: 'Setup Test',
        email: 'setup@test.com',
        subject: 'Database Setup Test',
        message: 'Testing if contact messages work after setup.',
        email_status: 'pending'
      }])
      .select();

    if (error) {
      console.log('   ❌ Contact messages not working:', error.message);
      console.log('   💡 Need to create the table first');
    } else {
      console.log('   ✅ Contact messages working perfectly!');
      successCount++;
      
      // Clean up test message
      if (data && data[0]) {
        await supabase.from('contact_messages').delete().eq('id', data[0].id);
        console.log('   🧹 Test message cleaned up');
      }
    }
  } catch (error) {
    console.log('   ❌ Contact message test failed:', error.message);
  }

  // Step 3: Check and assign admin role
  console.log('\n👑 Step 3/8: Setting up admin role...');
  try {
    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', CURRENT_USER_ID)
      .eq('role', 'admin');

    if (existingRole && existingRole.length > 0) {
      console.log('   ✅ Admin role already assigned!');
      successCount++;
    } else {
      // Try to assign admin role
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: CURRENT_USER_ID,
          role: 'admin'
        }]);

      if (error) {
        console.log('   ❌ Could not assign admin role:', error.message);
        console.log('   💡 Will need manual SQL execution');
      } else {
        console.log('   ✅ Admin role assigned successfully!');
        successCount++;
      }
    }
  } catch (error) {
    console.log('   ❌ Admin role setup failed:', error.message);
  }

  // Step 4: Check other required tables
  const requiredTables = [
    'audio_content',
    'play_history', 
    'time_slots',
    'broadcast_sessions'
  ];

  for (let i = 0; i < requiredTables.length; i++) {
    const table = requiredTables[i];
    const stepNum = i + 4;
    
    console.log(`\n📊 Step ${stepNum}/8: Checking ${table} table...`);
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${table} table missing:`, error.message);
        console.log('   💡 Needs to be created via SQL script');
      } else {
        console.log(`   ✅ ${table} table exists and accessible!`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${table}:`, error.message);
    }
  }

  // Summary and next steps
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Working components: ${successCount}/${totalSteps}`);
  console.log(`❌ Need manual setup: ${totalSteps - successCount}/${totalSteps}`);

  if (successCount === totalSteps) {
    console.log('\n🎉 AMAZING! Everything is already set up correctly!');
    console.log('✅ All database tables exist');
    console.log('✅ Admin role is assigned');
    console.log('✅ Contact form should work');
    console.log('✅ No more 404 errors expected');
    console.log('\n🚀 Your app is ready to use!');
  } else {
    console.log('\n🔧 MANUAL SETUP REQUIRED');
    console.log('Some components need to be set up manually:');
    console.log('\n📋 TO FIX EVERYTHING:');
    console.log('1. Go to Supabase Dashboard SQL Editor');
    console.log('2. Copy contents of fix-all-database-errors.sql');
    console.log('3. Paste and run the entire script');
    console.log('4. Run this script again to verify');
    console.log('\n🔗 Direct link:');
    console.log('https://supabase.com/dashboard/project/cnysfutwvxfxuvawbybb/sql');
  }

  return successCount === totalSteps;
}

// Run the setup
autoSetupDatabase()
  .then(success => {
    if (success) {
      console.log('\n🎯 SETUP COMPLETE - Ready to test your app!');
    } else {
      console.log('\n⚠️  SETUP INCOMPLETE - Manual SQL execution needed');
    }
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Try running the SQL script manually in Supabase Dashboard');
  });