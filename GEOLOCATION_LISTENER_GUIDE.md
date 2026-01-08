# Geolocation-Based Listener Tracking System

This system provides real-time listener tracking based on actual geographic location rather than hardcoded data.

## Features

### 🌍 Real Geolocation Tracking
- **Browser Geolocation API**: Uses HTML5 geolocation for precise coordinates
- **IP-based Fallback**: Falls back to IP geolocation when GPS is unavailable
- **Caching System**: Caches geolocation data to reduce API calls
- **Privacy Compliant**: Respects user privacy preferences

### 📊 Real-time Analytics
- **Live Listener Count**: Real-time count of active listeners
- **Geographic Distribution**: Shows listeners by country, region, and city
- **Device Analytics**: Tracks mobile, desktop, and tablet usage
- **Session Tracking**: Monitors listening duration and engagement

### 🔄 Automatic Updates
- **Heartbeat System**: Keeps sessions alive with periodic updates
- **Real-time Subscriptions**: Uses Supabase real-time for live updates
- **Activity Tracking**: Monitors user interactions and engagement
- **Session Management**: Handles page visibility and unload events

## Implementation

### 1. Database Setup

Run the migration to set up the geolocation tracking tables:

```sql
-- This creates the necessary tables and functions
-- File: supabase/migrations/20260108000003_geolocation_listener_system.sql
```

### 2. React Integration

#### Basic Usage

```tsx
import { useGeolocationListeners } from '@/hooks/useGeolocationListeners';
import GeolocationListenerMap from '@/components/GeolocationListenerMap';

function RadioPlayer() {
  const {
    listenerStats,
    userLocation,
    isListening,
    trackInteraction,
    updateAudioSettings
  } = useGeolocationListeners();

  return (
    <div>
      {/* Your radio player UI */}
      
      {/* Listener statistics display */}
      <GeolocationListenerMap />
      
      {/* Track user interactions */}
      <button onClick={() => trackInteraction('like')}>
        Like ({listenerStats.total_listeners} listening)
      </button>
    </div>
  );
}
```

#### Advanced Usage

```tsx
import { useListenerTracking } from '@/hooks/useListenerTracking';

function LiveShow({ showId }: { showId: string }) {
  const {
    listenerCount,
    isListening,
    startListening,
    stopListening,
    recordInteraction,
    userLocation,
    listenerStats
  } = useListenerTracking(showId);

  return (
    <div>
      <h2>Live Show - {listenerCount} Listeners</h2>
      
      {userLocation && (
        <p>Broadcasting to {userLocation.city}, {userLocation.country}</p>
      )}
      
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      
      <button onClick={() => recordInteraction('chat')}>
        Send Message
      </button>
    </div>
  );
}
```

### 3. Geolocation Permissions

The system handles geolocation permissions gracefully:

```tsx
const { geolocationPermission } = useGeolocationListeners();

// Permission states: 'granted', 'denied', 'prompt', 'unknown'
if (geolocationPermission === 'denied') {
  // Show fallback message or request permission
}
```

## API Reference

### useGeolocationListeners Hook

```tsx
const {
  // State
  currentSession,        // Current listener session data
  listenerStats,         // Real-time listener statistics
  loading,              // Loading state
  geolocationPermission, // GPS permission status
  
  // Actions
  startListenerSession,  // Start tracking session
  endListenerSession,    // End tracking session
  trackInteraction,      // Record user interaction
  updateAudioSettings,   // Update volume/mute status
  updateStreamQuality,   // Update stream quality
  
  // Computed
  isListening,          // Whether user is currently listening
  userLocation          // User's geographic location
} = useGeolocationListeners();
```

### GeolocationListenerMap Component

```tsx
<GeolocationListenerMap 
  className="w-full" // Optional styling
/>
```

## Data Structure

### Listener Session
```typescript
interface ListenerSession {
  id: string;
  session_id: string;
  user_id?: string;
  ip_address: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  connection_type?: 'mobile' | 'desktop' | 'tablet';
  browser_name?: string;
  os_name?: string;
  started_at: string;
  last_activity: string;
  duration_seconds: number;
  stream_quality: string;
  volume_level: number;
  is_muted: boolean;
  interactions: number;
}
```

### Listener Statistics
```typescript
interface ListenerStats {
  total_listeners: number;
  countries: Array<{
    country_name: string;
    country_code: string;
    listener_count: number;
  }>;
  devices: Array<{
    connection_type: string;
    count: number;
  }>;
  top_locations: Array<{
    city: string;
    region: string;
    country_name: string;
    listener_count: number;
    avg_lat: number;
    avg_lng: number;
  }>;
}
```

## Privacy & Compliance

### GDPR Compliance
- **Consent Management**: Request permission before accessing location
- **Data Minimization**: Only collect necessary location data
- **User Control**: Allow users to disable location tracking
- **Data Retention**: Automatic cleanup of old session data

### Location Privacy
- **Opt-in Only**: Location tracking requires explicit user consent
- **Fallback Options**: Works without precise location data
- **Anonymization**: IP addresses can be anonymized
- **Granular Control**: Users can choose location precision level

## Production Considerations

### External Services Integration

For production use, integrate with professional geolocation services:

```typescript
// Example: MaxMind GeoIP2 integration
const getLocationFromIP = async (ip: string) => {
  const response = await fetch(`/api/geoip/${ip}`);
  return response.json();
};

// Example: Google Geocoding for reverse lookup
const getCityFromCoordinates = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );
  return response.json();
};
```

### Performance Optimization

1. **Caching**: Implement Redis caching for geolocation data
2. **Rate Limiting**: Limit geolocation API calls per IP
3. **Batch Processing**: Aggregate statistics in background jobs
4. **CDN**: Use CDN for static geolocation data

### Monitoring & Analytics

```typescript
// Track system performance
const trackGeolocationPerformance = {
  accuracy: 'high|medium|low',
  response_time: 'milliseconds',
  cache_hit_rate: 'percentage',
  error_rate: 'percentage'
};
```

## Troubleshooting

### Common Issues

1. **Geolocation Permission Denied**
   - Fallback to IP-based location
   - Show user-friendly message
   - Provide manual location selection

2. **Slow Geolocation Response**
   - Implement timeout (10 seconds)
   - Use cached data when available
   - Show loading indicators

3. **Inaccurate Location Data**
   - Combine multiple data sources
   - Allow user correction
   - Use confidence scores

### Debug Mode

Enable debug logging:

```typescript
// Add to your environment variables
VITE_GEOLOCATION_DEBUG=true

// This will log detailed geolocation information
```

## Migration from Hardcoded Data

To migrate from hardcoded listener data:

1. **Run the new migration**: Creates geolocation tables
2. **Update components**: Replace hardcoded data with real hooks
3. **Test thoroughly**: Verify location accuracy and privacy compliance
4. **Monitor performance**: Watch for any performance impacts

The system is designed to be backward compatible and will gracefully handle missing geolocation data.