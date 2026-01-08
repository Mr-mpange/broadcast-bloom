import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBroadcastControl } from '@/hooks/useBroadcastControl';
import { useAudioContent } from '@/hooks/useAudioContent';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2,
  Settings,
  AlertTriangle,
  Clock,
  Users,
  Music,
  Zap,
  Activity,
  SkipForward,
  RotateCcw
} from 'lucide-react';

interface BroadcastControlPanelProps {
  className?: string;
}

const BroadcastControlPanel = ({ className }: BroadcastControlPanelProps) => {
  const {
    currentSession,
    permissions,
    currentTimeSlot,
    loading,
    microphoneActive,
    currentMode,
    isLive,
    canBroadcast,
    startBroadcastSession,
    endBroadcastSession,
    toggleMicrophone,
    switchMode,
    logAction,
    triggerEmergencyOverride,
  } = useBroadcastControl();

  const {
    currentlyPlaying,
    playAudioContent,
    stopAudioContent,
    musicTracks,
    jingles,
  } = useAudioContent();

  const [emergencyTitle, setEmergencyTitle] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);

  // Format time slot display
  const formatTimeSlot = (timeSlot: any) => {
    if (!timeSlot) return 'No assigned time slot';
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[timeSlot.day_of_week]} ${timeSlot.start_time} - ${timeSlot.end_time}`;
  };

  // Handle going live
  const handleGoLive = async () => {
    if (!canBroadcast) return;
    
    const sessionId = await startBroadcastSession('live');
    if (sessionId) {
      await logAction('session_start', { mode: 'live' });
    }
  };

  // Handle ending broadcast
  const handleEndBroadcast = async () => {
    if (!currentSession) return;
    
    const success = await endBroadcastSession();
    if (success) {
      await logAction('session_end');
    }
  };

  // Handle microphone toggle
  const handleMicToggle = async () => {
    if (!permissions.canControlMicrophone) return;
    
    await toggleMicrophone();
  };

  // Handle mode switch
  const handleModeSwitch = async (mode: 'live' | 'automation') => {
    if (!permissions.canSwitchModes) return;
    
    await switchMode(mode);
  };

  // Handle playing audio content
  const handlePlayContent = async (content: any) => {
    if (!permissions.canControlMusic) return;
    
    const success = await playAudioContent(content, currentSession?.id);
    if (success) {
      await logAction('play_track', { content_name: content.name }, content.id);
    }
  };

  // Handle jingle trigger
  const handleTriggerJingle = async (jingle: any) => {
    if (!permissions.canTriggerJingles) return;
    
    const success = await playAudioContent(jingle, currentSession?.id);
    if (success) {
      await logAction('trigger_jingle', { jingle_name: jingle.name }, jingle.id);
    }
  };

  // Handle emergency override
  const handleEmergencyOverride = async () => {
    if (!permissions.canEmergencyOverride || !emergencyTitle || !emergencyMessage) return;
    
    const emergencyId = await triggerEmergencyOverride(
      emergencyTitle,
      emergencyMessage,
      1, // Highest priority
      'emergency'
    );
    
    if (emergencyId) {
      setEmergencyTitle('');
      setEmergencyMessage('');
      setShowEmergencyPanel(false);
    }
  };

  if (loading) {
    return (
      <Card className={`glass-panel border-border/50 ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">
            Loading broadcast controls...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Broadcast Status Header */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Broadcast Control Panel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isLive ? "destructive" : "secondary"} className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isLive ? 'LIVE' : 'OFF AIR'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {currentMode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Slot Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeSlot(currentTimeSlot)}</span>
          </div>

          {/* Current Session Info */}
          {currentSession && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                Broadcasting since {new Date(currentSession.started_at).toLocaleTimeString()}
                {currentlyPlaying && (
                  <span className="ml-2">
                    • Now Playing: <strong>{currentlyPlaying.name}</strong>
                    {currentlyPlaying.artist && ` by ${currentlyPlaying.artist}`}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Controls */}
          <div className="flex flex-wrap gap-3">
            {/* Go Live / End Broadcast */}
            {!isLive ? (
              <Button
                onClick={handleGoLive}
                disabled={!canBroadcast}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Radio className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            ) : (
              <Button
                onClick={handleEndBroadcast}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Square className="h-4 w-4 mr-2" />
                End Broadcast
              </Button>
            )}

            {/* Microphone Control */}
            {permissions.canControlMicrophone && (
              <Button
                onClick={handleMicToggle}
                variant={microphoneActive ? "default" : "outline"}
                className={microphoneActive ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {microphoneActive ? (
                  <Mic className="h-4 w-4 mr-2" />
                ) : (
                  <MicOff className="h-4 w-4 mr-2" />
                )}
                {microphoneActive ? 'Mic ON' : 'Mic OFF'}
              </Button>
            )}

            {/* Mode Switch */}
            {permissions.canSwitchModes && (
              <div className="flex gap-1 border rounded-md">
                <Button
                  onClick={() => handleModeSwitch('live')}
                  variant={currentMode === 'live' ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                >
                  Live
                </Button>
                <Button
                  onClick={() => handleModeSwitch('automation')}
                  variant={currentMode === 'automation' ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                >
                  Auto
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      {(permissions.canControlMusic || permissions.canTriggerJingles) && (
        <Tabs defaultValue="music" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            {permissions.canControlMusic && (
              <TabsTrigger value="music" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Music
              </TabsTrigger>
            )}
            {permissions.canTriggerJingles && (
              <TabsTrigger value="jingles" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Jingles
              </TabsTrigger>
            )}
          </TabsList>

          {/* Music Control */}
          {permissions.canControlMusic && (
            <TabsContent value="music">
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Music Library
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentlyPlaying && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{currentlyPlaying.name}</p>
                          {currentlyPlaying.artist && (
                            <p className="text-sm text-muted-foreground">by {currentlyPlaying.artist}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={stopAudioContent}>
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {musicTracks.slice(0, 10).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => handlePlayContent(track)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.name}</p>
                          {track.artist && (
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artist} {track.album && `• ${track.album}`}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Jingles Control */}
          {permissions.canTriggerJingles && (
            <TabsContent value="jingles">
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Station Jingles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {jingles.map((jingle) => (
                      <Button
                        key={jingle.id}
                        onClick={() => handleTriggerJingle(jingle)}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-2"
                      >
                        <Volume2 className="h-5 w-5" />
                        <span className="text-xs text-center">{jingle.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Emergency Override Panel (Admin Only) */}
      {permissions.canEmergencyOverride && (
        <Card className="glass-panel border-border/50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Override
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showEmergencyPanel ? (
              <Button
                onClick={() => setShowEmergencyPanel(true)}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Activate Emergency Override
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Emergency override will interrupt all current broadcasts and take priority.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Input
                    placeholder="Emergency Title"
                    value={emergencyTitle}
                    onChange={(e) => setEmergencyTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Emergency Message"
                    value={emergencyMessage}
                    onChange={(e) => setEmergencyMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleEmergencyOverride}
                    variant="destructive"
                    disabled={!emergencyTitle || !emergencyMessage}
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Trigger Emergency
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEmergencyPanel(false);
                      setEmergencyTitle('');
                      setEmergencyMessage('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {isLive ? '●' : '○'}
              </div>
              <p className="text-xs text-muted-foreground">Broadcast</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {microphoneActive ? '●' : '○'}
              </div>
              <p className="text-xs text-muted-foreground">Microphone</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {currentlyPlaying ? '●' : '○'}
              </div>
              <p className="text-xs text-muted-foreground">Audio</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {currentMode === 'automation' ? '●' : '○'}
              </div>
              <p className="text-xs text-muted-foreground">Automation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastControlPanel; 