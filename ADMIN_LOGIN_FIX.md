# Admin Login Redirect Fix

## ✅ Problem Fixed!

The issue was that all users were being redirected to `/dj` dashboard regardless of their role. I've implemented proper role-based redirection.

## 🔧 Changes Made

### 1. Created Role-Based Redirect Hook
- **File**: `src/hooks/useRoleRedirect.tsx`
- **Purpose**: Checks user roles and redirects to appropriate dashboard
- **Logic**: 
  - Admin → `/admin` dashboard
  - DJ/Presenter → `/dj` dashboard  
  - Moderator/Listener → `/` homepage

### 2. Updated Auth Page
- **File**: `src/pages/Auth.tsx`
- **Change**: Now uses role-based redirection instead of hardcoded `/dj`
- **Behavior**: After login, checks user role and redirects appropriately

## 🎯 How It Works Now

### Login Flow:
1. **User logs in** → Authentication successful
2. **Check roles** → Query `user_roles` table for user's roles
3. **Redirect based on priority**:
   - `admin` role → Admin Dashboard (`/admin`)
   - `dj` or `presenter` role → DJ Dashboard (`/dj`)
   - `moderator` or `listener` role → Homepage (`/`)
   - No roles → Homepage (`/`)

### Role Priority:
- **Admin** has highest priority (even if they also have DJ role)
- **DJ/Presenter** second priority
- **Moderator/Listener** go to homepage

## 🧪 Testing Admin Login

### Option 1: Use Test Admin Account
1. Go to `/test-users` page
2. Click "Create All Test Users" 
3. Use these admin credentials:
   - **Email**: `admin.pulsefm@gmail.com`
   - **Password**: `admin123456`

### Option 2: Make Existing User Admin
Run this SQL in your Supabase dashboard:
```sql
-- Replace 'your-user-id' with actual user ID
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'admin');
```

### Option 3: Check Current Admin Users
Run: `node check-admin-users.js` to see existing admin users

## 🔍 Debugging

### If Still Redirecting Wrong:
1. **Check user roles**: Look in Supabase → Authentication → Users
2. **Verify role assignment**: Check `user_roles` table
3. **Clear browser cache**: Old session data might interfere
4. **Check console logs**: Role checking is logged for debugging

### Common Issues:
- **No admin role assigned**: User needs `admin` role in `user_roles` table
- **Multiple roles**: Admin role should take priority (it does now)
- **Session cache**: Try logging out and back in

## ✅ Expected Behavior

### Admin User Login:
1. Login with admin credentials
2. See "Checking permissions..." briefly
3. Redirect to `/admin` dashboard
4. See Admin Dashboard with all management features

### DJ User Login:
1. Login with DJ credentials  
2. Redirect to `/dj` dashboard
3. See DJ Dashboard with broadcasting features

### Regular User Login:
1. Login with listener credentials
2. Redirect to `/` homepage
3. Can browse shows, chat, etc.

## 🎉 Ready to Test!

Your admin login should now work correctly. Admin users will be redirected to the Admin Dashboard where they can:
- Manage users and roles
- View contact messages
- Monitor active sessions
- Access system analytics
- Control broadcast settings

The role-based redirection ensures each user type gets the appropriate interface for their permissions level!