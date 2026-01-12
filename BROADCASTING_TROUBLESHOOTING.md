# Broadcasting System Troubleshooting Guide

## Issues Fixed

### 1. Live Sessions Not Visible to Listeners ✅

**Problem**: When DJs start broadcasting, listeners couldn't see the live session.

**Root Cause**: The live show detection system wasn't properly connected to the broadcast sessions table.

**Solution Applied**:
- Updated `useLiveShows.ts` to check for active `broadcast_sessions` instead of relying on localStorage
- Connected live show detection to real-time broadcast session changes
- Fixed the LiveShowManager to properly start broadcast sessions when going live

**How it works now**:
1. DJ clicks "Go Live" in LiveShowManager
2. System creates a `broadcast_session` record with status 'active'
3. `useLiveShows` hook detects active sessions and shows them to listeners
4. LivePlayer component displays the live show to listeners

### 2. Hardware Mixer Conflicts with Serato DJ Pro ✅

**Problem**: Connecting hardware mixer to the web app caused Serato DJ Pro to freeze.

**Root Cause**: Both applications were trying to access the same MIDI device simultaneously.

**Solution Applied**:
- Added better device filtering to avoid Serato-specific devices
- Removed auto-connection to prevent conflicts
- Added conflict detection and error handling
- Improved device scanning to exclude virtual MIDI devices

**Best Practices for Hardware Setup**:

#### Option 1: Use Separate Audio Interface (Recommended)
```
DJ Mixer → Audio Interface → Computer
         ↓
    Serato DJ Pro (for track control)
    Web App (for broadcast control via audio interface)
```

#### Option 2: Use Different MIDI Channels
```
Hardware Mixer:
- Channel 1-8: Serato DJ Pro
- Channel 9-16: Web App broadcast controls
```

#### Option 3: Sequential Usage
1. Start Serato DJ Pro first
2. Load and prepare your tracks
3. When ready to broadcast, connect web app to mixer
4. Use Serato for track management, web app for broadcast control

### 3. Permission Issues Fixed ✅

**Problem**: DJs getting "Not allowed to start live" errors despite being logged in as DJ.

**Root Cause**: System was checking for time slots that didn't exist in the database.

**Solution Applied**:
- Simplified permission checking to only verify user roles (admin, dj, presenter)
- Removed time slot restrictions temporarily
- Added better error messages for permission issues

## Current Broadcasting Flow

### For DJs:
1. **Login** with DJ account
2. **Go to DJ Dashboard** (`/dj`)
3. **Select Hardware** (optional - for mixer control)
4. **Choose Show** in Live Show Manager
5. **Click "Go Live"** - This now:
   - Creates broadcast session
   - Marks show as live
   - Makes it visible to listeners
6. **Use Broadcast Controls** for microphone, mode switching
7. **End Show** when finished

### For Listeners:
1. **Visit Homepage** or any page with LivePlayer
2. **See Live Badge** when DJ is broadcasting
3. **Click Play** to start listening
4. **See Now Playing** information
5. **Chat with other listeners** (if signed in)

## Hardware Setup Recommendations

### Recommended Hardware Flow:
```
Turntables/CDJs → DJ Mixer → Audio Interface → Computer
                     ↓
               Monitor Speakers
                     ↓
            (Optional) Hardware Controls
```

### Software Setup:
1. **Serato DJ Pro**: Use for track management and mixing
2. **Web App**: Use for broadcast control and listener interaction
3. **Audio Interface**: Route final mix to web app for streaming

### MIDI Control Setup:
- **Primary MIDI**: Serato DJ Pro (channels 1-8)
- **Secondary MIDI**: Web App (channels 9-16 or separate device)
- **Audio Routing**: Mixer main output → Audio interface → Web app

## Troubleshooting Common Issues

### Issue: "Not authorized to broadcast"
**Solution**: 
1. Check you're logged in as DJ/Admin/Presenter
2. Verify your user role in the database
3. Try refreshing the page

### Issue: Serato freezes when connecting mixer
**Solution**:
1. Close Serato DJ Pro
2. Disconnect and reconnect mixer
3. Start web app first, then Serato
4. Or use separate audio interface

### Issue: Listeners can't see live show
**Solution**:
1. Make sure you clicked "Go Live" in LiveShowManager
2. Check browser console for errors
3. Verify broadcast session was created
4. Try refreshing listener's page

### Issue: Hardware controls not working
**Solution**:
1. Check MIDI device is connected and not in use
2. Try scanning for devices again
3. Manually select the correct device
4. Check browser permissions for MIDI access

## Database Tables Involved

### `broadcast_sessions`
- Tracks active broadcast sessions
- Links to user who's broadcasting
- Contains session status and metadata

### `shows`
- Contains show information
- Links to host (DJ/Presenter)
- Used for display information

### `user_roles`
- Defines who can broadcast
- Roles: admin, dj, presenter, moderator, listener

### `now_playing`
- Current track information
- Updated by DJ during broadcast
- Displayed to listeners

## Testing Your Setup

1. **As DJ**: Login → Go to /dj → Start live show → Check broadcast controls
2. **As Listener**: Open homepage → Should see live badge → Click play → Should hear stream
3. **Hardware**: Connect mixer → Scan devices → Test controls → Verify no Serato conflicts

## Next Steps for Production

1. **Set up actual streaming server** (Icecast/SHOUTcast)
2. **Configure audio routing** from mixer to streaming server
3. **Add proper time slot management** for scheduled shows
4. **Implement listener analytics** and engagement features
5. **Add mobile app support** for on-the-go broadcasting

The system is now properly connected and should work for live broadcasting!