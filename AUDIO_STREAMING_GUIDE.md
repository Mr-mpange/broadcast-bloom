# Live Audio Streaming Implementation Guide

## Current Implementation ✅

Your Broadcast Bloom app now has:
- Real audio streaming with HTML5 Audio API
- Volume controls and muting
- Loading states and error handling
- Stream quality configuration
- Integration with your existing live show system

## Stream Configuration

Update `src/config/streams.ts` with your actual stream URLs:

```typescript
export const STREAM_CONFIG = {
  live: {
    url: "https://your-actual-stream.com/live.mp3", // Replace this!
    backup: "https://backup-stream.com/live.mp3",
    format: "mp3",
    bitrate: 128,
  }
};
```

## Streaming Service Options

### Free Options
1. **Icecast** (Self-hosted)
   - Download from: https://icecast.org/
   - Stream URL format: `http://your-server.com:8000/live.mp3`

2. **SHOUTcast** (Free tier available)
   - Stream URL format: `http://your-server.com:8000/;stream.mp3`

### Paid Services
1. **Radio.co** - Easy setup, reliable
   - Stream URL: `https://streaming.radio.co/your-station/listen`

2. **Live365** - Professional features
3. **Mixlr** - Simple broadcasting

## Broadcasting Software

To create your live stream, use:
- **OBS Studio** (Free) - Most popular
- **BUTT** (Broadcast Using This Tool) - Simple
- **SAM Broadcaster** - Professional
- **Virtual DJ** - For DJs

## Advanced Features to Add

### 1. HLS Streaming (Better for mobile)
```typescript
// Add to useAudioPlayer.tsx
if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
  const hls = new Hls();
  hls.loadSource(streamUrl);
  hls.attachMedia(audioRef.current);
}
```

### 2. Stream Metadata (Now Playing)
```typescript
// Add metadata parsing for Icecast/SHOUTcast
const fetchMetadata = async () => {
  const response = await fetch(`${streamUrl}/7.html`);
  const data = await response.text();
  // Parse current track info
};
```

### 3. Audio Visualization
```typescript
// Add Web Audio API for visualizations
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(audioElement);
source.connect(analyser);
```

### 4. Offline Detection
```typescript
// Handle network issues
window.addEventListener('online', () => {
  if (wasPlaying) resumeStream();
});
```

## Testing Your Stream

1. Update the stream URL in `src/config/streams.ts`
2. Start your dev server: `npm run dev`
3. Click the play button in the Live Player
4. Check browser console for any errors

## Troubleshooting

### CORS Issues
If you get CORS errors, your streaming server needs to allow your domain:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Mobile Playback
Mobile browsers require user interaction before playing audio. The current implementation handles this correctly.

### Stream Formats
- **MP3**: Best compatibility
- **AAC**: Better quality, good mobile support  
- **HLS (.m3u8)**: Best for mobile, requires additional setup

## Next Steps

1. Set up your streaming server
2. Update the stream URLs in the config
3. Test with your actual audio stream
4. Consider adding metadata parsing for "Now Playing" info
5. Add audio visualization if desired