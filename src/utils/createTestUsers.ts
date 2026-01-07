import { supabase } from "@/integrations/supabase/client";

export const testUsers = [
  {
    email: 'admin.pulsefm@gmail.com',
    password: 'admin123456',
    role: 'admin',
    displayName: 'Admin User',
    bio: 'System Administrator - Managing PULSE FM operations'
  },
  {
    email: 'dj.pulsefm@gmail.com', 
    password: 'dj123456',
    role: 'dj',
    displayName: 'DJ Mike',
    bio: 'Professional DJ specializing in Afrobeats and Hip-Hop'
  },
  {
    email: 'presenter.pulsefm@gmail.com',
    password: 'presenter123456',
    role: 'presenter',
    displayName: 'Sarah Presenter',
    bio: 'Talk show host and content creator covering African culture and music'
  },
  {
    email: 'moderator.pulsefm@gmail.com',
    password: 'mod123456', 
    role: 'moderator',
    displayName: 'John Moderator',
    bio: 'Community Moderator keeping the chat friendly'
  },
  {
    email: 'listener.pulsefm@gmail.com',
    password: 'listener123456',
    role: 'listener', 
    displayName: 'Jane Listener',
    bio: 'Music lover and regular PULSE FM listener'
  }
];

export async function createTestUser(user: typeof testUsers[0]) {
  try {
    console.log(`Creating user: ${user.email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          display_name: user.displayName,
          bio: user.bio,
          role: user.role
        },
        emailRedirectTo: undefined // Disable email confirmation redirect
      }
    });

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ User created: ${user.displayName} (${user.email})`);
    
    // Auto-confirm the user immediately after creation
    if (data.user) {
      console.log(`📧 Auto-confirming email for ${user.email}...`);
      
      try {
        // Use the Edge Function to confirm the email
        const confirmResponse = await supabase.functions.invoke('confirm-test-users', {
          body: { emails: [user.email] }
        });
        
        if (confirmResponse.error) {
          console.warn(`⚠️ Could not auto-confirm ${user.email}:`, confirmResponse.error.message);
        } else if (confirmResponse.data?.results?.[0]?.success) {
          console.log(`✅ Email auto-confirmed for ${user.email}`);
        } else {
          console.warn(`⚠️ Auto-confirmation may have failed for ${user.email}`);
        }
      } catch (confirmError) {
        console.warn(`⚠️ Auto-confirmation error for ${user.email}:`, confirmError);
      }
      
      // Wait a moment for confirmation to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now assign the role using the database function
      const { error: roleError } = await supabase.rpc('assign_user_role', {
        user_email: user.email,
        user_role: user.role,
        user_display_name: user.displayName,
        user_bio: user.bio
      });

      if (roleError) {
        console.error(`❌ Failed to assign role to ${user.email}:`, roleError.message);
        return { success: false, error: roleError.message };
      }

      console.log(`✅ Role ${user.role} assigned to ${user.email}`);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error(`❌ Failed to create ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function createAllTestUsers() {
  console.log('🚀 Creating test users for PULSE FM...');
  console.log('📧 Using Gmail addresses with auto-confirmation...');
  
  const results = [];
  
  for (const user of testUsers) {
    console.log(`📝 Creating: ${user.email} (${user.role})`);
    const result = await createTestUser(user);
    results.push({ user: user.email, ...result });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('📊 Test user creation results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.user}: ${result.success ? 'Success (Auto-confirmed)' : result.error}`);
  });
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📈 Summary: ${successful} users created and confirmed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n💡 If creation failed, try:');
    console.log('1. Disable email confirmation in Supabase Dashboard');
    console.log('2. Create users manually at /auth page');
    console.log('3. Use Supabase Dashboard → Authentication → Users');
  } else {
    console.log('\n🎉 All test users created and ready to use!');
  }
  
  return results;
}

// Function to manually confirm test user emails
export async function confirmTestUserEmails() {
  try {
    console.log('📧 Attempting to confirm test user emails...');
    
    const emails = testUsers.map(user => user.email);
    
    const response = await supabase.functions.invoke('confirm-test-users', {
      body: { emails }
    });
    
    if (response.error) {
      console.error('❌ Failed to confirm emails:', response.error);
      return { success: false, error: response.error.message };
    }
    
    if (response.data?.results) {
      response.data.results.forEach((result: any) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.email}: ${result.success ? 'Confirmed' : result.error}`);
      });
      
      const successful = response.data.results.filter((r: any) => r.success).length;
      console.log(`📈 Confirmed ${successful} out of ${emails.length} emails`);
      
      return { success: true, results: response.data.results };
    }
    
    return { success: false, error: 'No results returned' };
  } catch (error: any) {
    console.error('❌ Email confirmation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to assign roles to existing users
export async function assignRoleToExistingUser(email: string, role: string, displayName?: string, bio?: string) {
  try {
    const { error } = await supabase.rpc('assign_user_role', {
      user_email: email,
      user_role: role,
      user_display_name: displayName,
      user_bio: bio
    });

    if (error) {
      console.error(`❌ Failed to assign role to ${email}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Role ${role} assigned to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Failed to assign role to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}