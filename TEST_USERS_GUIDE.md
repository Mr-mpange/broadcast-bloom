# Test Users Setup Guide

## 🎯 Quick Setup for Testing

### Step 1: Apply Database Migrations

First, make sure all migrations are applied:

```bash
npx supabase db push
```

### Step 2: Create Test Users

You have two options to create test users:

#### Option A: Manual Creation (Recommended)

1. Go to your app's `/auth` page
2. Create these users manually:

| Role | Email | Password | Display Name |
|------|-------|----------|--------------|
| **Admin** | `admin@pulsefm.test` | `admin123456` | Admin User |
| **DJ** | `dj@pulsefm.test` | `dj123456` | DJ Mike |
| **Moderator** | `moderator@pulsefm.test` | `mod123456` | Sarah Moderator |
| **Listener** | `listener@pulsefm.test` | `listener123456` | John Listener |

#### Option B: Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add User" and create each test user
4. Use the emails and passwords from the table above

### Step 3: Assign Roles

After creating the users, run this SQL in your Supabase SQL Editor:

```sql
-- Assign admin role
SELECT assign_user_role('admin@pulsefm.test', 'admin', 'Admin User', 'System Administrator');

-- Assign DJ role  
SELECT assign_user_role('dj@pulsefm.test', 'dj', 'DJ Mike', 'Professional DJ specializing in Afrobeats');

-- Assign moderator role
SELECT assign_user_role('moderator@pulsefm.test', 'moderator', 'Sarah Moderator', 'Community Moderator');

-- Assign listener role
SELECT assign_user_role('listener@pulsefm.test', 'listener', 'John Listener', 'Music lover and PULSE FM listener');
```

### Step 4: Test Features

Now you can test different features with different user roles:

#### 🔑 **Admin User** (`admin@pulsefm.test`)
- ✅ Access DJ Dashboard
- ✅ Create and manage shows
- ✅ Upload show artwork
- ✅ Start/stop live broadcasts
- ✅ View analytics and listener stats
- ✅ Moderate chat
- ✅ All listener features

#### 🎧 **DJ User** (`dj@pulsefm.test`)
- ✅ Access DJ Dashboard
- ✅ Create and manage own shows
- ✅ Upload show artwork
- ✅ Start/stop live broadcasts
- ✅ Moderate chat
- ✅ All listener features

#### 🛡️ **Moderator User** (`moderator@pulsefm.test`)
- ✅ Moderate chat messages
- ✅ Ban users from chat
- ✅ All listener features
- ❌ Cannot access DJ Dashboard
- ❌ Cannot create shows

#### 👤 **Listener User** (`listener@pulsefm.test`)
- ✅ Browse and discover shows
- ✅ Listen to live streams
- ✅ Add shows to favorites
- ✅ Receive notifications for favorite shows
- ✅ Participate in chat
- ❌ Cannot access DJ Dashboard
- ❌ Cannot create shows

## 🧪 Testing Scenarios

### Test Live Broadcasting
1. Sign in as DJ or Admin
2. Go to DJ Dashboard
3. Use "Live Show Manager" to start a broadcast
4. Sign in as Listener to see live notifications

### Test Chat System
1. Go to any show detail page
2. Sign in with different users
3. Test sending messages
4. Test moderation features with Moderator/DJ/Admin

### Test Favorites & Notifications
1. Sign in as Listener
2. Add shows to favorites
3. Sign in as DJ/Admin and start a live show
4. Check notifications as Listener

### Test Image Upload
1. Sign in as DJ or Admin
2. Create or edit a show
3. Use the image upload component
4. Verify images appear correctly

## 🔧 Troubleshooting

### Users Not Getting Roles
If users don't have the correct roles after creation:

1. Check if the migration ran successfully
2. Manually run the role assignment SQL
3. Verify in Supabase Dashboard > Authentication > Users

### Shows Not Appearing
If test shows aren't created:

1. Check the migration logs
2. Manually create shows through the DJ Dashboard
3. Verify database permissions

### Chat Not Working
If chat isn't functioning:

1. Check Supabase Realtime is enabled
2. Verify chat room creation triggers
3. Test with different user roles

## 📊 Sample Data Included

The migrations also create:
- **4 Sample Shows** with different genres and schedules
- **Sample Listener Stats** from various African countries
- **Sample Now Playing** information
- **Sample Notifications** for testing
- **Sample Favorites** for the listener user

## 🚀 Ready to Test!

Once you've completed these steps, you'll have a fully functional test environment with:
- Users representing all role types
- Sample shows and schedules
- Test data for analytics
- Working chat rooms
- Notification system

Happy testing! 🎵