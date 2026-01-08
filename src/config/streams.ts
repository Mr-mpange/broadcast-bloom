// Stream configuration
export const STREAM_CONFIG = {
  // Replace these with your actual stream URLs
  live: {
    // Using a working test stream for now
    url: "https://stream.zeno.fm/0r0xa792kwzuv", // Test stream that works
    // Backup stream URL
    backup: "https://stream.zeno.fm/0r0xa792kwzuv",
    // Stream format
    format: "mp3", // or "aac", "hls"
    // Bitrate
    bitrate: 128,
  },
  
  // Different quality streams
  quality: {
    high: "https://stream.zeno.fm/0r0xa792kwzuv", // 320kbps
    medium: "https://stream.zeno.fm/0r0xa792kwzuv", // 128kbps  
    low: "https://stream.zeno.fm/0r0xa792kwzuv", // 64kbps
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