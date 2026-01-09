import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  console.log('🔍 Checking admin users...\n');
  
  try {
    // Check for admin roles
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin');

    if (rolesError) {
      console.log('❌ Error checking admin roles:', rolesError.message);
      return;
    }

    console.log(`📊 Found ${adminRoles?.length || 0} admin users`);

    if (adminRoles && adminRoles.length > 0) {
      console.log('\n👑 Admin Users:');
      
      for (const role of adminRoles) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', role.user_id)
          .single();

        console.log(`  - User ID: ${role.user_id}`);
        console.log(`    Display Name: ${profile?.display_name || 'Not set'}`);
        console.log(`    Email: ${profile?.user_id || 'Unknown'}`);
        console.log('');
      }
    } else {
      console.log('\n⚠️  No admin users found!');
      console.log('\n📝 To create an admin user:');
      console.log('1. Sign up for an account normally');
      console.log('2. Run this SQL in your Supabase dashboard:');
      console.log('');
      console.log('   INSERT INTO user_roles (user_id, role)');
      console.log('   VALUES (\'YOUR_USER_ID_HERE\', \'admin\');');
      console.log('');
      console.log('3. Or use the test users page to create admin accounts');
    }

    // Check all user roles for debugging
    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('*');

    console.log(`\n📋 Total user roles in database: ${allRoles?.length || 0}`);
    
    if (allRoles && allRoles.length > 0) {
      const roleCounts = allRoles.reduce((acc, role) => {
        acc[role.role] = (acc[role.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Role distribution:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count} users`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminUsers();