import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { sendHardwareControl, toggleLiveBroadcast } from '@/utils/hardwareAPI';
import { 
  Radio, 
  Wifi, 
  WifiOff,
  Settings,
  Volume2,
  Mic,
  Sliders,
  Activity
} from 'lucide-react';

interface HardwareMixerProps {
  onMixerConnect?: (connected: boolean) => void;
  onHardwareControl?: (control: string, value: number) => void;
}

const HardwareMixerControl = ({ onMixerConnect, onHardwareControl }: HardwareMixerProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [mixerModel, setMixerModel] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'usb' | 'midi' | 'audio' | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState({
    crossfader: 50,
    channel1Volume: 75,
    channel2Volume: 75,
    masterVolume: 80,
    micLevel: 0,
    isLive: false
  });

  // Hardware connection detection
  useEffect(() => {
    detectHardwareMixer();
  }, []);

  const detectHardwareMixer = async () => {
    setIsScanning(true);
    
    try {
      // Reset connection state first
      setIsConnected(false);
      setMixerModel(null);
      setConnectionType(null);
      
      // Check for MIDI devices (DJ controllers)
      if (navigator.requestMIDIAccess) {
        try {
          const midiAccess = await navigator.requestMIDIAccess();
          const inputs = Array.from(midiAccess.inputs.values());
          
          if (inputs.length > 0) {
            const djController = inputs.find(input => 
              input.name?.toLowerCase().includes('dj') ||
              input.name?.toLowerCase().includes('mixer') ||
              input.name?.toLowerCase().includes('pioneer') ||
              input.name?.toLowerCase().includes('numark') ||
              input.name?.toLowerCase().includes('denon')
            );
            
            if (djController) {
              setIsConnected(true);
              setMixerModel(djController.name || 'Unknown DJ Controller');
              setConnectionType('midi');
              setupMIDIListeners(djController);
              
              toast({
                title: "Hardware Mixer Connected!",
                description: `Connected to ${djController.name}`,
              });
              
              onMixerConnect?.(true);
              setIsScanning(false);
              return;
            }
          }
        } catch (midiError) {
          console.log('MIDI access failed:', midiError);
        }
      }

      // Check for Audio devices (USB mixers)
      if (navigator.mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          
          const mixerDevice = audioInputs.find(device =>
            device.label.toLowerCase().includes('mixer') ||
            device.label.toLowerCase().includes('dj') ||
            device.label.toLowerCase().includes('pioneer') ||
            device.label.toLowerCase().includes('behringer')
          );
          
          if (mixerDevice) {
            setIsConnected(true);
            setMixerModel(mixerDevice.label);
            setConnectionType('audio');
            
            toast({
              title: "Audio Mixer Detected!",
              description: `Found ${mixerDevice.label}`,
            });
            
            onMixerConnect?.(true);
            setIsScanning(false);
            return;
          }
        } catch (audioError) {
          console.log('Audio device access failed:', audioError);
        }
      }
      
      // If no hardware found
      toast({
        title: "No Hardware Found",
        description: "No compatible mixers detected. Check connections and try again.",
        variant: "destructive",
      });
      
      onMixerConnect?.(false);
      
    } catch (error) {
      console.error('Hardware detection failed:', error);
      toast({
        title: "Hardware Detection Failed",
        description: "Could not detect hardware mixer. Check connections.",
        variant: "destructive",
      });
      
      onMixerConnect?.(false);
    } finally {
      setIsScanning(false);
    }
  };

  const setupMIDIListeners = (midiInput: any) => {
    midiInput.onmidimessage = (message: any) => {
      const [command, control, value] = message.data;
      
      // Parse MIDI control changes (CC messages)
      if (command === 176) { // Control Change
        handleHardwareControl(control, value);
      }
    };
  }; 
 const handleHardwareControl = (control: number, value: number) => {
    // Map MIDI CC numbers to mixer controls (common mappings)
    const controlMap: { [key: number]: string } = {
      1: 'crossfader',
      7: 'masterVolume',
      14: 'channel1Volume',
      15: 'channel2Volume',
      16: 'micLevel',
      // Add more mappings based on your hardware
    };

    const controlName = controlMap[control];
    if (controlName) {
      const normalizedValue = Math.round((value / 127) * 100);
      
      setHardwareStatus(prev => ({
        ...prev,
        [controlName]: normalizedValue
      }));
      
      onHardwareControl?.(controlName, normalizedValue);
      
      // Send to broadcast system
      sendToBroadcast(controlName, normalizedValue);
    }
  };

  const sendToBroadcast = async (control: string, value: number) => {
    try {
      const success = await sendHardwareControl({
        control,
        value,
        timestamp: Date.now(),
        mixerModel,
        connectionType
      });
      
      if (success) {
        console.log(`Hardware control sent: ${control} = ${value}`);
      }
    } catch (error) {
      console.error('Failed to send hardware control:', error);
    }
  };

  const goLive = async () => {
    setIsToggling(true);
    
    try {
      const newLiveState = !hardwareStatus.isLive;
      
      // Show immediate feedback
      toast({
        title: newLiveState ? "Going Live..." : "Going Offline...",
        description: isConnected 
          ? "Connecting hardware mixer to broadcast system..." 
          : "Starting software-only broadcast mode...",
      });
      
      const success = await toggleLiveBroadcast({
        isLive: newLiveState,
        mixerModel: mixerModel || 'Software Mode',
        hardwareStatus: { ...hardwareStatus, isLive: newLiveState }
      });

      if (success) {
        // Update state only after successful API call
        setHardwareStatus(prev => ({ ...prev, isLive: newLiveState }));
        
        toast({
          title: newLiveState ? "🔴 Now Live!" : "⚫ Gone Offline",
          description: newLiveState 
            ? (isConnected 
                ? "Hardware mixer is now broadcasting live" 
                : "Software broadcast mode is active")
            : "Broadcast stopped",
        });
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Go Live error:', error);
      toast({
        title: "Broadcast Error",
        description: "Failed to connect to broadcast system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const reconnectHardware = async () => {
    // Show loading state
    toast({
      title: "Reconnecting...",
      description: "Scanning for hardware mixers...",
    });
    
    // Detect hardware again
    await detectHardwareMixer();
  };

  return (
    <div className="space-y-6">
      {/* Hardware Connection Status */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Radio className="h-5 w-5 text-primary" />
            Broadcast Control
            <Badge variant={isConnected ? "default" : "secondary"} className="ml-2">
              {isConnected ? "HARDWARE" : "SOFTWARE"}
            </Badge>
            <Badge variant={hardwareStatus.isLive ? "destructive" : "secondary"} className="ml-2">
              {hardwareStatus.isLive ? "● LIVE" : "OFFLINE"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              {mixerModel && (
                <p className="text-sm text-muted-foreground">
                  Model: {mixerModel}
                </p>
              )}
              {connectionType && (
                <p className="text-sm text-muted-foreground">
                  Type: {connectionType.toUpperCase()}
                </p>
              )}
            </div>

            {/* Hardware Status */}
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">
                  {hardwareStatus.isLive ? "🔴 Broadcasting" : "⚫ Offline"}
                </span>
              </div>
              {isConnected && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Mode: </span>
                  <span className="font-medium">Hardware Connected</span>
                </div>
              )}
              {!isConnected && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Mode: </span>
                  <span className="font-medium">Software Only</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={goLive}
                variant={hardwareStatus.isLive ? "destructive" : "default"}
                className="gap-2"
                disabled={isToggling}
              >
                <Radio size={16} />
                {isToggling 
                  ? (hardwareStatus.isLive ? "Going Offline..." : "Going Live...") 
                  : (hardwareStatus.isLive ? "Go Offline" : "Go Live")
                }
              </Button>
              <Button
                onClick={reconnectHardware}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isScanning}
              >
                <Settings size={16} />
                {isScanning ? "Scanning..." : "Reconnect"}
              </Button>
              {!isConnected && (
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your DJ controller/mixer for hardware control
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Control Levels - Show when connected */}
      {isConnected && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sliders className="h-5 w-5 text-primary" />
              Hardware Control Levels
              <Badge variant="outline" className="ml-2">
                Live Control
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Main Mix Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Main Mix</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} />
                      <span className="text-sm">Crossfader</span>
                    </div>
                    <span className="text-sm font-medium">{hardwareStatus.crossfader}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-200" 
                      style={{ width: `${hardwareStatus.crossfader}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} />
                      <span className="text-sm">Master Volume</span>
                    </div>
                    <span className="text-sm font-medium">{hardwareStatus.masterVolume}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-200" 
                      style={{ width: `${hardwareStatus.masterVolume}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Channel Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Channels</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={14} />
                      <span className="text-sm">Channel 1</span>
                    </div>
                    <span className="text-sm font-medium">{hardwareStatus.channel1Volume}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-200" 
                      style={{ width: `${hardwareStatus.channel1Volume}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={14} />
                      <span className="text-sm">Channel 2</span>
                    </div>
                    <span className="text-sm font-medium">{hardwareStatus.channel2Volume}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-200" 
                      style={{ width: `${hardwareStatus.channel2Volume}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Microphone */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Audio Input</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic size={14} />
                      <span className="text-sm">Microphone</span>
                    </div>
                    <span className="text-sm font-medium">{hardwareStatus.micLevel}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-200 ${
                        hardwareStatus.micLevel > 0 ? 'bg-red-500' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${Math.max(hardwareStatus.micLevel, 5)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {hardwareStatus.micLevel > 0 ? '🎤 Active' : '🔇 Muted'}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings size={14} />
                <span className="text-sm font-medium">Hardware Instructions</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Use your mixer's faders and knobs to control levels in real-time</p>
                <p>• Crossfader blends between Channel 1 and Channel 2</p>
                <p>• Master Volume controls the overall broadcast output</p>
                <p>• Press the Play button on your controller to go live instantly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hardware Device Info - Show when connected */}
      {isConnected && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5 text-primary" />
              Hardware Device Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Device: </span>
                <span className="font-medium">{mixerModel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Connection: </span>
                <span className="font-medium">{connectionType?.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium text-green-500">✅ Ready for broadcasting</span>
              </div>
              <div>
                <span className="text-muted-foreground">Control Mode: </span>
                <span className="font-medium">Real-time MIDI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default HardwareMixerControl;