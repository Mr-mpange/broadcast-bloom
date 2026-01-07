# 🔧 Manual Test User Creation Guide

Since the automated user creation is having issues, here's how to create test users manually:

## 📝 **Method 1: Through Your App**

1. **Go to the Auth Page**: `http://localhost:8080/auth`
2. **Sign Up with these credentials**:

### **Admin User**
- **Email**: `admin.pulsefm@gmail.com`
- **Password**: `admin123456`
- **Display Name**: `Admin User`

### **DJ User**
- **Email**: `dj.pulsefm@gmail.com`
- **Password**: `dj123456`
- **Display Name**: `DJ Mike`

### **Presenter User**
- **Email**: `presenter.pulsefm@gmail.com`
- **Password**: `presenter123456`
- **Display Name**: `Sarah Presenter`

### **Moderator User**
- **Email**: `moderator.pulsefm@gmail.com`
- **Password**: `mod123456`
- **Display Name**: `John Moderator`

### **Listener User**
- **Email**: `listener.pulsefm@gmail.com`
- **Password**: `listener123456`
- **Display Name**: `Jane Listener`

## 🗄️ **Method 2: Through Supabase Dashboard**

1. **Go to your Supabase Dashboard**
2. **Navigate to**: Authentication → Users
3. **Click**: "Add User"
4. **Fill in the details** from the table above
5. **Repeat** for each user

## 🔑 **Method 3: Assign Roles After Creation**

After creating users through either method, run this SQL in your Supabase SQL Editor:

```sql
-- Assign admin role
SELECT assign_user_role('admin.pulsefm@gmail.com', 'admin', 'Admin User', 'System Administrator');

-- Assign DJ role  
SELECT assign_user_role('dj.pulsefm@gmail.com', 'dj', 'DJ Mike', 'Professional DJ specializing in Afrobeats');

-- Assign presenter role
SELECT assign_user_role('presenter.pulsefm@gmail.com', 'presenter', 'Sarah Presenter', 'Talk show host and content creator');

-- Assign moderator role
SELECT assign_user_role('moderator.pulsefm@gmail.com', 'moderator', 'John Moderator', 'Community Moderator');

-- Assign listener role
SELECT assign_user_role('listener.pulsefm@gmail.com', 'listener', 'Jane Listener', 'Music lover and PULSE FM listener');
```

## 🎯 **Quick Test**

After creating users:

1. **Sign in as Admin**: `admin.pulsefm@gmail.com` / `admin123456`
2. **Go to DJ Dashboard**: Should have full access
3. **Test Blog Management**: Create a blog post
4. **Test Show Management**: Create a show
5. **Test Live Broadcasting**: Start a live show

## 🔧 **Troubleshooting**

### **If emails are rejected**:
- Try using `@gmail.com` or `@example.com` instead
- Example: `admin.pulsefm@gmail.com`

### **If roles aren't assigned**:
- Run the SQL commands above manually
- Check Supabase Dashboard → Authentication → Users
- Verify the `user_roles` table has entries

### **If features don't work**:
- Check browser console for errors
- Verify you're signed in with the correct user
- Try refreshing the page

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Admin can access DJ Dashboard
- ✅ Admin can see Blog Management tab
- ✅ DJ can access DJ Dashboard but not Blog Management
- ✅ Presenter can access DJ Dashboard and Blog Management
- ✅ Moderator cannot access DJ Dashboard
- ✅ Listener can only access basic features

**Once you have at least one admin user created, you can test all the features!** 🎵📻