# 🎛️ Mixer Hardware Shared Access Setup Guide

## Problem: Exclusive Audio Device Access

When you connect your DJ mixer to your computer, Windows typically opens it in **exclusive mode**, meaning only ONE application can use it at a time. This causes conflicts when:
- Your mixer's software (e.g., Pioneer Rekordbox, Serato) is running
- Your browser (PULSE FM) tries to access the same device
- Other audio applications are using the device

## Solution: Enable Shared Audio Access

### Windows 10/11 Setup

#### Step 1: Configure Windows Audio Settings

1. **Open Sound Settings**
   - Right-click the speaker icon in taskbar
   - Click "Open Sound settings"
   - Scroll down and click "Sound Control Panel"

2. **Configure Recording Device**
   - Go to the "Recording" tab
   - Find your DJ mixer/audio interface
   - Right-click → "Properties"

3. **Disable Exclusive Mode**
   - Go to the "Advanced" tab
   - **UNCHECK** "Allow applications to take exclusive control of this device"
   - **UNCHECK** "Give exclusive mode applications priority"
   - Click "Apply" then "OK"

4. **Configure Playback Device (if applicable)**
   - Go to the "Playback" tab
   - Find your mixer's output device
   - Right-click → "Properties"
   - Go to "Advanced" tab
   - **UNCHECK** both exclusive mode options
   - Click "Apply" then "OK"

#### Step 2: Configure Your Mixer Software

##### For Pioneer Rekordbox:
1. Open Rekordbox Preferences
2. Go to Audio → Audio Device Settings
3. **UNCHECK** "Use exclusive mode"
4. Set buffer size to 512 or higher (reduces conflicts)
5. Click "Apply"

##### For Serato DJ:
1. Open Serato DJ Pro
2. Go to Setup → Audio
3. **UNCHECK** "Use exclusive mode"
4. Set latency to 10ms or higher
5. Click "Apply"

##### For Traktor:
1. Open Traktor Preferences
2. Go to Audio Setup
3. **UNCHECK** "Exclusive Mode"
4. Increase latency to 10-15ms
5. Click "OK"

##### For Virtual DJ:
1. Open Virtual DJ Settings
2. Go to Audio → Sound Card
3. Select "WASAPI" (not ASIO)
4. **UNCHECK** "Exclusive mode"
5. Click "Apply"

#### Step 3: Configure Browser Audio

##### Chrome/Edge:
1. Go to `chrome://flags` or `edge://flags`
2. Search for "Exclusive audio"
3. Set to **Disabled**
4. Restart browser

##### Firefox:
1. Type `about:config` in address bar
2. Search for `media.getusermedia.audio.exclusive`
3. Set to **false**
4. Restart browser

### Alternative Solution: Use ASIO4ALL (Advanced)

If you need low latency AND shared access:

1. **Download ASIO4ALL**
   - Visit: http://www.asio4all.org/
   - Download and install latest version

2. **Configure ASIO4ALL**
   - Open ASIO4ALL control panel
   - Find your mixer device
   - **CHECK** "Allow multiple applications"
   - Set buffer size to 512 or higher

3. **Configure Your DJ Software**
   - Set audio driver to "ASIO4ALL"
   - Your mixer software and browser can now share access

### Virtual Audio Cable Solution (Recommended for Broadcasting)

This is the BEST solution for simultaneous use:

#### Setup Virtual Audio Cable

1. **Install VB-Audio Cable**
   - Download from: https://vb-audio.com/Cable/
   - Install "CABLE A+B" version
   - **Restart computer**

2. **Route Mixer Output to Virtual Cable**
   - Open Windows Sound Settings
   - Set your mixer as default recording device
   - Open your DJ software
   - Set output to "CABLE Input"

3. **Configure PULSE FM**
   - Open PULSE FM in browser
   - Go to Hardware Mixer Control
   - Select "CABLE Output" as input device
   - Your mixer software plays through virtual cable
   - PULSE FM receives audio from virtual cable

#### Connection Flow:
```
🎛️ DJ Mixer → 💻 DJ Software → 🔊 Virtual Cable → 🌐 PULSE FM Browser
```

This way:
- ✅ DJ software has full control of mixer
- ✅ PULSE FM receives the mixed audio
- ✅ No conflicts or exclusive access issues
- ✅ Both can run simultaneously

### Testing Your Setup

1. **Start Your DJ Software**
   - Load a track and play it
   - Verify audio is working

2. **Open PULSE FM**
   - Go to DJ Dashboard
   - Click "Hardware Mixer" tab
   - Click "Reconnect" button

3. **Check Connection**
   - Should show "Connected" status
   - Should display your mixer model
   - Should show "Shared Mode" or "Virtual Cable"

4. **Test Broadcasting**
   - Click "Go Live"
   - Play music in DJ software
   - Verify audio is being broadcast

### Troubleshooting

#### "Device is busy" Error
**Cause:** Another application has exclusive access
**Solution:**
1. Close all audio applications
2. Disable exclusive mode in Windows (see Step 1)
3. Restart computer
4. Open applications in this order:
   - DJ software first
   - Browser second

#### "Access Denied" Error
**Cause:** Browser doesn't have microphone permission
**Solution:**
1. Go to Windows Settings → Privacy → Microphone
2. Enable "Allow apps to access your microphone"
3. Enable for your browser specifically
4. Restart browser

#### Audio Stuttering/Glitching
**Cause:** Buffer size too small or CPU overload
**Solution:**
1. Increase buffer size in DJ software (512 or 1024)
2. Increase browser latency settings
3. Close unnecessary applications
4. Use virtual audio cable instead

#### Mixer Not Detected
**Cause:** Drivers not installed or device not recognized
**Solution:**
1. Install manufacturer's drivers
2. Restart computer
3. Check Device Manager for errors
4. Try different USB port (USB 3.0 preferred)

#### Both Apps Work Separately But Not Together
**Cause:** Exclusive mode still enabled somewhere
**Solution:**
1. Check Windows Sound settings (disable exclusive mode)
2. Check DJ software settings (disable exclusive mode)
3. Check browser flags (disable exclusive audio)
4. Use virtual audio cable as workaround

### Recommended Setup for Best Results

#### For Live Broadcasting:
```
Hardware Mixer → Audio Interface → Virtual Cable → PULSE FM
                                  ↓
                            DJ Software (monitoring)
```

#### For Recording Shows:
```
Hardware Mixer → Audio Interface → DJ Software → Virtual Cable → PULSE FM
                                                                    ↓
                                                              Recording
```

### Performance Tips

1. **Use Wired Connection**
   - USB 3.0 or Thunderbolt for mixer
   - Ethernet for internet (not WiFi)

2. **Optimize Windows**
   - Disable Windows audio enhancements
   - Set power plan to "High Performance"
   - Close background applications

3. **Buffer Settings**
   - DJ Software: 512 samples
   - Browser: Default (auto)
   - Virtual Cable: 512 samples

4. **Sample Rate**
   - Use 48kHz everywhere (consistent)
   - Don't mix 44.1kHz and 48kHz

### Quick Reference Commands

#### Check Audio Devices (PowerShell):
```powershell
Get-PnpDevice -Class AudioEndpoint | Select-Object Status, FriendlyName
```

#### Restart Audio Service (if needed):
```powershell
Restart-Service -Name Audiosrv
```

#### Test Audio Device:
```powershell
# Open Sound settings
control mmsys.cpl
```

## Need More Help?

If you're still experiencing issues:

1. Check your mixer's manual for shared access settings
2. Update audio drivers from manufacturer's website
3. Try a different USB port or cable
4. Consider using a dedicated audio interface
5. Use virtual audio cable as a reliable workaround

## Summary

The key to simultaneous access is:
1. ✅ Disable exclusive mode in Windows
2. ✅ Disable exclusive mode in DJ software
3. ✅ Disable exclusive mode in browser
4. ✅ OR use virtual audio cable (recommended)

With these settings, your mixer hardware will work with both your DJ software and PULSE FM at the same time!
