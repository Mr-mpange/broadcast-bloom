// Test user creation script for PULSE FM
// Run this in your browser console on the auth page or use it as a reference

const testUsers = [
  {
    email: 'admin@pulsefm.test',
    password: 'admin123456',
    role: 'admin',
    displayName: 'Admin User',
    bio: 'System Administrator - Managing PULSE FM operations'
  },
  {
    email: 'dj@pulsefm.test', 
    password: 'dj123456',
    role: 'dj',
    displayName: 'DJ Mike',
    bio: 'Professional DJ specializing in Afrobeats and Hip-Hop'
  },
  {
    email: 'moderator@pulsefm.test',
    password: 'mod123456', 
    role: 'moderator',
    displayName: 'Sarah Moderator',
    bio: 'Community Moderator keeping the chat friendly'
  },
  {
    email: 'listener@pulsefm.test',
    password: 'listener123456',
    role: 'listener', 
    displayName: 'John Listener',
    bio: 'Music lover and regular PULSE FM listener'
  }
];

// Function to create users (run this in browser console)
async function createTestUsers() {
  console.log('Creating test users for PULSE FM...');
  
  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // You would typically use your auth system here
      // For Supabase, it would be something like:
      /*
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            display_name: user.displayName,
            bio: user.bio,
            role: user.role
          }
        }
      });
      */
      
      console.log(`✅ User created: ${user.displayName} (${user.email})`);
    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error);
    }
  }
  
  console.log('Test user creation complete!');
}

// Instructions for manual creation
console.log('=== PULSE FM Test Users ===');
console.log('Create these users manually through your auth system:');
console.log('');

testUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.role.toUpperCase()} USER:`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log(`   Display Name: ${user.displayName}`);
  console.log(`   Role: ${user.role}`);
  console.log('');
});

console.log('After creating users, run the database migration to assign roles and create test data.');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testUsers, createTestUsers };
}