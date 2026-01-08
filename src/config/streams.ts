// Stream configuration
export const STREAM_CONFIG = {
  // Replace these with your actual stream URLs
  live: {
    // Main live stream URL (MP3, AAC, or HLS)
    url: "https://your-radio-stream.com/live.mp3",
    // Backup stream URL
    backup: "https://backup-stream.com/live.mp3",
    // Stream format
    format: "mp3", // or "aac", "hls"
    // Bitrate
    bitrate: 128,
  },
  
  // Different quality streams
  quality: {
    high: "https://your-radio-stream.com/live-320.mp3", // 320kbps
    medium: "https://your-radio-stream.com/live-128.mp3", // 128kbps  
    low: "https://your-radio-stream.com/live-64.mp3", // 64kbps
  }
};

// Popular streaming services and their URL formats:
export const STREAMING_SERVICES = {
  // Icecast server example
  icecast: "http://your-server.com:8000/live.mp3",
  
  // SHOUTcast server example  
  shoutcast: "http://your-server.com:8000/;stream.mp3",
  
  // Radio.co example
  radioCo: "https://streaming.radio.co/your-station/listen",
  
  // Live365 example
  live365: "https://live365.com/stations/your-station/listen",
  
  // Mixlr example
  mixlr: "https://mixlr.com/your-show/embed",
};

// Get stream URL based on quality preference
export const getStreamUrl = (quality: 'high' | 'medium' | 'low' = 'medium') => {
  return STREAM_CONFIG.quality[quality] || STREAM_CONFIG.live.url;
};