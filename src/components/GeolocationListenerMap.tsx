import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGeolocationListeners } from '@/hooks/useGeolocationListeners';
import { 
  Globe, 
  MapPin, 
  Users, 
  Smartphone, 
  Monitor, 
  Tablet,
  RefreshCw,
  TrendingUp,
  Radio
} from 'lucide-react';

interface GeolocationListenerMapProps {
  className?: string;
}

const GeolocationListenerMap = ({ className }: GeolocationListenerMapProps) => {
  const {
    listenerStats,
    currentSession,
    userLocation,
    loading,
    geolocationPermission,
    fetchListenerStats,
    isListening
  } = useGeolocationListeners();

  const [refreshing, setRefreshing] = useState(false);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchListenerStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Get device type icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Get flag emoji for country code
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <Card className={`glass-panel border-border/50 ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">
            Loading listener data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current User Location */}
      {isListening && userLocation && (
        <Card className="glass-panel border-border/50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Radio className="h-5 w-5" />
              You're Listening Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">
                  {userLocation.city && userLocation.region 
                    ? `${userLocation.city}, ${userLocation.region}`
                    : userLocation.country || 'Unknown Location'
                  }
                </p>
                {userLocation.country && (
                  <p className="text-sm text-muted-foreground">
                    {getFlagEmoji(currentSession?.country_code || '')} {userLocation.country}
                  </p>
                )}
              </div>
              {geolocationPermission === 'granted' && (
                <Badge variant="outline" className="ml-auto">
                  <Globe className="h-3 w-3 mr-1" />
                  GPS Enabled
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Listener Statistics */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Listeners
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {listenerStats.total_listeners} Online
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Geographic Distribution */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geographic Distribution
            </h4>
            {listenerStats.countries.length > 0 ? (
              <div className="space-y-2">
                {listenerStats.countries.slice(0, 8).map((country, index) => (
                  <div key={country.country_code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getFlagEmoji(country.country_code)}
                      </span>
                      <span className="font-medium">{country.country_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ 
                            width: `${(country.listener_count / listenerStats.total_listeners) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="outline" className="min-w-[3rem] justify-center">
                        {country.listener_count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No geographic data available
              </p>
            )}
          </div>

          {/* Device Distribution */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Device Types
            </h4>
            {listenerStats.devices.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {listenerStats.devices.map((device) => (
                  <div key={device.connection_type} className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getDeviceIcon(device.connection_type)}
                    </div>
                    <p className="text-sm font-medium capitalize">{device.connection_type}</p>
                    <p className="text-lg font-bold text-primary">{device.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No device data available
              </p>
            )}
          </div>

          {/* Top Listening Cities */}
          {listenerStats.top_locations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top Listening Cities
              </h4>
              <div className="space-y-2">
                {listenerStats.top_locations.slice(0, 5).map((location, index) => (
                  <div key={`${location.city}-${location.country_name}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{location.city}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.region}, {location.country_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {location.listener_count} listener{location.listener_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geolocation Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Location Services:</span>
              <Badge 
                variant={geolocationPermission === 'granted' ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                {geolocationPermission === 'granted' ? 'Enabled' : 
                 geolocationPermission === 'denied' ? 'Disabled' : 'Unknown'}
              </Badge>
            </div>
            {geolocationPermission === 'denied' && (
              <p className="text-xs text-muted-foreground mt-1">
                Enable location services for more accurate listener tracking
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Updates Info */}
      <Card className="glass-panel border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live updates every 10 seconds</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeolocationListenerMap;