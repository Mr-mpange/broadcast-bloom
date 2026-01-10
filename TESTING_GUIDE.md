# 🧪 Testing Guide for PULSE FM

## 🎯 **Quick Testing Steps**

### **1. Fix Role Assignment (Run in Supabase SQL Editor)**
```sql
-- Copy and paste QUICK_ROLE_ASSIGNMENT.sql content
-- This will assign proper roles to your test accounts
```

### **2. Test Login Redirects**
1. **Go to**: `http://localhost:8081/auth`
2. **Login with each account**:
   - `kilindosaid771@gmail.com` → Should redirect to `/admin`
   - `kilindo1@gmail.com` → Should redirect to `/dj`
   - `kilindo2@gmail.com` → Should redirect to `/dj`
   - `kilindo3@gmail.com` → Should redirect to `/dj`

### **3. Test Professional DJ Mixer**
1. **Login as DJ**: `kilindo1@gmail.com`
2. **Go to**: `http://localhost:8081/dj`
3. **Click**: "Professional Mixer" tab
4. **Features to test**:
   - ✅ **Load Audio Files** - Drag & drop MP3/WAV files to Deck A & B
   - ✅ **Crossfader** - Move slider between decks
   - ✅ **EQ Controls** - Adjust High/Mid/Low frequencies
   - ✅ **Effects** - Apply reverb, delay, filter, flanger
   - ✅ **Beat Sync** - Sync tempo between tracks
   - ✅ **Cue Points** - Set markers in tracks
   - ✅ **Looping** - Create beat loops

### **4. Test Navigation Bar**
1. **When NOT logged in**: Should only show "Sign In"
2. **When logged in as listener**: Should only show "Sign Out"
3. **When logged in as DJ/Admin**: Should show dashboard link ONLY if not on dashboard
4. **When on dashboard**: Should show "Home" button instead

### **5. Test Admin Dashboard**
1. **Login as Admin**: `kilindosaid771@gmail.com`
2. **Go to**: `http://localhost:8081/admin`
3. **Check**: User Management tab shows real names (not "Unknown User")

## 🐛 **Debug Information**

### **Check Browser Console**
Look for these debug messages:
```
User roles found: ['admin']
Redirecting admin to /admin
Loading: false | DJ: true | Dashboard: false
```

### **Check Network Tab**
- Role queries should return data
- No 404 errors on dashboard routes
- Supabase queries should succeed

### **Common Issues & Fixes**

**Issue**: Dashboard links still showing everywhere
**Fix**: Check browser console for role loading status

**Issue**: Login not redirecting
**Fix**: Run the role assignment SQL script

**Issue**: "Unknown User" in admin
**Fix**: Check if profiles table has data

**Issue**: Mixer not loading
**Fix**: Check browser console for JavaScript errors

## 🎧 **Professional DJ Mixer Testing**

### **Audio File Requirements**
- **Formats**: MP3, WAV, OGG, M4A, FLAC
- **Size**: Under 50MB per file
- **Quality**: Any bitrate/sample rate

### **Mixer Features to Test**
1. **Dual Decks**: Load different tracks on each deck
2. **Crossfading**: Smooth transitions between tracks
3. **EQ**: Shape the sound with 3-band equalizer
4. **Effects**: Add reverb, delay, filters
5. **Beat Sync**: Match tempos automatically
6. **Cue Points**: Mark important sections
7. **Looping**: Create seamless loops

### **Expected Behavior**
- ✅ Waveforms appear after loading audio
- ✅ Play/pause controls work
- ✅ Volume sliders affect audio
- ✅ Crossfader blends between decks
- ✅ EQ changes audio frequencies
- ✅ Effects process audio in real-time

## 🚀 **Quick Test Checklist**

- [ ] Run role assignment SQL script
- [ ] Test login redirects for all accounts
- [ ] Verify navigation bar behavior
- [ ] Test professional DJ mixer features
- [ ] Check admin user management
- [ ] Verify no "Unknown User" displays
- [ ] Test audio file loading and playback
- [ ] Verify all mixer controls work

## 📍 **Direct URLs for Testing**

- **Home**: `http://localhost:8081/`
- **Login**: `http://localhost:8081/auth`
- **DJ Dashboard**: `http://localhost:8081/dj`
- **Admin Dashboard**: `http://localhost:8081/admin`
- **Professional Mixer**: `http://localhost:8081/dj` → "Professional Mixer" tab

Your PULSE FM platform is ready for comprehensive testing! 🎵🧪