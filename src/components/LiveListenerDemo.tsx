import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGeolocationListeners } from '@/hooks/useGeolocationListeners';
import GeolocationListenerMap from '@/components/GeolocationListenerMap';
import { 
  Radio, 
  MapPin, 
  Users, 
  Play, 
  Square,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle
} from 'lucide-react';

const LiveListenerDemo = () => {
  const {
    listenerStats,
    currentSession,
    userLocation,
    isListening,
    loading,
    geolocationPermission,
    startListenerSession,
    endListenerSession,
    trackInteraction,
    updateAudioSettings
  } = useGeolocationListeners();

  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    updateAudioSettings(newVolume, isMuted);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    updateAudioSettings(volume, newMuted);
  };

  const handleLike = () => {
    trackInteraction('like');
  };

  const handleComment = () => {
    trackInteraction('comment');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Loading geolocation listener system...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            Live Radio with Geolocation Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isListening ? "default" : "secondary"} className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {listenerStats.total_listeners} Listeners
              </Badge>
              
              {userLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {userLocation.city && userLocation.region 
                      ? `${userLocation.city}, ${userLocation.region}`
                      : userLocation.country || 'Unknown Location'
                    }
                  </span>
                </div>
              )}
              
              {geolocationPermission === 'granted' && (
                <Badge variant="outline" className="text-xs">
                  GPS Enabled
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isListening ? (
                <Button onClick={startListenerSession} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Listening
                </Button>
              ) : (
                <Button onClick={endListenerSession} variant="outline" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop Listening
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      {isListening && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Audio Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-24"
                  disabled={isMuted}
                />
                <span className="text-sm text-muted-foreground w-8">
                  {isMuted ? '0' : volume}%
                </span>
              </div>

              {/* Interaction Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleLike} className="gap-1">
                  <Heart className="h-4 w-4" />
                  Like
                </Button>
                <Button variant="outline" size="sm" onClick={handleComment} className="gap-1">
                  <MessageCircle className="h-4 w-4" />
                  Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      {currentSession && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Session ID</p>
                <p className="font-mono text-xs">{currentSession.session_id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-muted-foreground">Device</p>
                <p className="capitalize">{currentSession.connection_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Browser</p>
                <p>{currentSession.browser_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interactions</p>
                <p>{currentSession.interactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geolocation Map */}
      <GeolocationListenerMap />

      {/* Debug Info */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Geolocation Permission:</span>
              <Badge variant={geolocationPermission === 'granted' ? 'default' : 'secondary'}>
                {geolocationPermission}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Session Active:</span>
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Listeners:</span>
              <span className="font-bold">{listenerStats.total_listeners}</span>
            </div>
            <div className="flex justify-between">
              <span>Countries Represented:</span>
              <span className="font-bold">{listenerStats.countries.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveListenerDemo;