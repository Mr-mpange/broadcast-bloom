import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENT_USER_ID = 'c7c30d40-2ffd-456b-bbaa-2f943470bbce';

async function completeSetup() {
  console.log('🎯 COMPLETE AUTOMATIC SETUP');
  console.log('=' .repeat(50));
  console.log('This will do EVERYTHING possible automatically!\n');

  // Step 1: Check what we can do automatically
  console.log('🔍 Step 1: Analyzing current state...');
  
  const checks = {
    userRoles: false,
    profiles: false,
    shows: false,
    favorites: false,
    contactMessages: false,
    audioContent: false,
    adminRole: false
  };

  // Check existing tables
  const tablesToCheck = [
    'user_roles',
    'profiles', 
    'shows',
    'favorites'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        checks[table.replace('_', '')] = true;
        console.log(`   ✅ ${table} table exists`);
      } else {
        console.log(`   ❌ ${table} table missing`);
      }
    } catch (err) {
      console.log(`   ❌ ${table} table error: ${err.message}`);
    }
  }

  // Check new tables that need to be created
  const newTables = ['contact_messages', 'audio_content'];
  for (const table of newTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (!error) {
        checks[table.replace('_', '')] = true;
        console.log(`   ✅ ${table} table exists`);
      } else {
        console.log(`   ❌ ${table} table missing - needs creation`);
      }
    } catch (err) {
      console.log(`   ❌ ${table} table missing - needs creation`);
    }
  }

  // Step 2: Do what we can automatically
  console.log('\n⚡ Step 2: Automatic fixes...');

  // Try to assign admin role if user_roles table exists
  if (checks.userRoles) {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', CURRENT_USER_ID)
        .eq('role', 'admin');

      if (!existingRole || existingRole.length === 0) {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: CURRENT_USER_ID, role: 'admin' }]);

        if (!error) {
          console.log('   ✅ Admin role assigned automatically!');
          checks.adminRole = true;
        } else {
          console.log('   ❌ Could not assign admin role:', error.message);
        }
      } else {
        console.log('   ✅ Admin role already exists!');
        checks.adminRole = true;
      }
    } catch (err) {
      console.log('   ❌ Admin role assignment failed:', err.message);
    }
  }

  // Try to create/update profile if profiles table exists
  if (checks.profiles) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert([{
          id: CURRENT_USER_ID,
          user_id: CURRENT_USER_ID,
          display_name: 'Admin User',
          role: 'admin'
        }]);

      if (!error) {
        console.log('   ✅ Admin profile created/updated!');
      } else {
        console.log('   ❌ Profile update failed:', error.message);
      }
    } catch (err) {
      console.log('   ❌ Profile creation failed:', err.message);
    }
  }

  // Step 3: Generate the missing SQL
  console.log('\n📝 Step 3: Generating SQL for missing components...');
  
  const missingSql = [];

  if (!checks.contactMessages) {
    missingSql.push(`
-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');`);
  }

  if (!checks.audioContent) {
    missingSql.push(`
-- Create audio_content table
CREATE TABLE IF NOT EXISTS audio_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  artist TEXT,
  content_type TEXT DEFAULT 'music',
  file_url TEXT,
  duration INTEGER,
  play_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active audio content" ON audio_content
  FOR SELECT USING (is_active = true);`);
  }

  // Step 4: Show results and next steps
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP RESULTS');
  console.log('='.repeat(60));

  const workingCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;

  console.log(`✅ Working: ${workingCount}/${totalCount} components`);
  console.log(`❌ Need setup: ${totalCount - workingCount}/${totalCount} components`);

  if (checks.adminRole) {
    console.log('\n🎉 GREAT NEWS: Admin role is set up!');
    console.log('✅ You should now be able to access admin dashboard');
    console.log('✅ Login should redirect to /admin');
  }

  if (missingSql.length > 0) {
    console.log('\n🔧 MANUAL SQL NEEDED:');
    console.log('Copy this SQL and run it in Supabase Dashboard:\n');
    console.log(missingSql.join('\n\n'));
    console.log('\n🔗 Run it here:');
    console.log('https://supabase.com/dashboard/project/cnysfutwvxfxuvawbybb/sql');
  } else {
    console.log('\n🎉 ALL DONE! No manual SQL needed!');
  }

  // Step 5: Final verification
  console.log('\n🧪 Step 4: Final verification...');
  
  if (checks.contactMessages) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([{
          name: 'Setup Complete Test',
          email: 'test@setup.com',
          subject: 'Setup Verification',
          message: 'This message confirms the setup is working!'
        }])
        .select();

      if (!error) {
        console.log('✅ Contact form is working perfectly!');
        
        // Clean up
        if (data && data[0]) {
          await supabase.from('contact_messages').delete().eq('id', data[0].id);
        }
      } else {
        console.log('❌ Contact form needs setup:', error.message);
      }
    } catch (err) {
      console.log('❌ Contact form test failed:', err.message);
    }
  }

  console.log('\n🎯 NEXT STEPS:');
  if (workingCount === totalCount) {
    console.log('🎉 Everything is ready! Test your app now!');
    console.log('1. Logout and login again');
    console.log('2. Should redirect to admin dashboard');
    console.log('3. Test contact form on homepage');
  } else {
    console.log('1. Run the SQL code shown above');
    console.log('2. Run this script again to verify');
    console.log('3. Test admin login and contact form');
  }
}

completeSetup().catch(console.error);