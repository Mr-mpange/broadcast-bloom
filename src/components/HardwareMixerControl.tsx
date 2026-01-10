import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { sendHardwareControl, toggleLiveBroadcast } from '@/utils/hardwareAPI';
import { 
  Zap, 
  Wifi, 
  WifiOff,
  Settings,
  Volume2,
  Mic,
  Radio,
  Power
} from 'lucide-react';

interface HardwareMixerProps {
  onMixerConnect?: (connected: boolean) => void;
  onHardwareControl?: (control: string, value: number) => void;
}

const HardwareMixerControl = ({ onMixerConnect, onHardwareControl }: HardwareMixerProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
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
    try {
      // Check for MIDI devices (DJ controllers)
      if (navigator.requestMIDIAccess) {
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
            return;
          }
        }
      }

      // Check for Audio devices (USB mixers)
      if (navigator.mediaDevices) {
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
        }
      }
      
    } catch (error) {
      console.error('Hardware detection failed:', error);
      toast({
        title: "Hardware Detection Failed",
        description: "Could not detect hardware mixer. Check connections.",
        variant: "destructive",
      });
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
    if (!isConnected) {
      toast({
        title: "No Hardware Connected",
        description: "Connect your hardware mixer first",
        variant: "destructive",
      });
      return;
    }

    try {
      const newLiveState = !hardwareStatus.isLive;
      setHardwareStatus(prev => ({ ...prev, isLive: newLiveState }));
      
      const success = await toggleLiveBroadcast({
        isLive: newLiveState,
        mixerModel,
        hardwareStatus: { ...hardwareStatus, isLive: newLiveState }
      });

      if (success) {
        toast({
          title: newLiveState ? "Now Live!" : "Gone Offline",
          description: newLiveState ? "Hardware mixer connected to live broadcast" : "Hardware mixer disconnected from broadcast",
        });
      }
    } catch (error) {
      toast({
        title: "Broadcast Error",
        description: "Failed to connect to broadcast system",
        variant: "destructive",
      });
    }
  };

  const reconnectHardware = () => {
    setIsConnected(false);
    setMixerModel(null);
    setConnectionType(null);
    detectHardwareMixer();
  };

  return (
    <div className="space-y-6">
      {/* Hardware Connection Status */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Hardware Mixer Control
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
              {isConnected ? "CONNECTED" : "DISCONNECTED"}
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
                <span className="text-muted-foreground">Crossfader: </span>
                <span className="font-medium">{hardwareStatus.crossfader}%</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Master Vol: </span>
                <span className="font-medium">{hardwareStatus.masterVolume}%</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Mic Level: </span>
                <span className="font-medium">{hardwareStatus.micLevel}%</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={goLive}
                variant={hardwareStatus.isLive ? "destructive" : "default"}
                className="gap-2"
                disabled={!isConnected}
              >
                <Radio size={16} />
                {hardwareStatus.isLive ? "Go Offline" : "Go Live"}
              </Button>
              <Button
                onClick={reconnectHardware}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings size={16} />
                Reconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Control Mapping */}
      {isConnected && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5 text-primary" />
              Hardware Control Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 size={14} />
                  <span className="font-medium">Crossfader</span>
                </div>
                <p className="text-muted-foreground">CC1 → Live Mix</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 size={14} />
                  <span className="font-medium">Master Vol</span>
                </div>
                <p className="text-muted-foreground">CC7 → Broadcast</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Mic size={14} />
                  <span className="font-medium">Microphone</span>
                </div>
                <p className="text-muted-foreground">CC16 → Live Audio</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Power size={14} />
                  <span className="font-medium">Channel Faders</span>
                </div>
                <p className="text-muted-foreground">CC14/15 → Mix</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Instructions */}
      {!isConnected && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Connect Your Hardware Mixer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Supported Hardware:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pioneer DJ Controllers (DDJ series)</li>
                  <li>• Numark DJ Controllers</li>
                  <li>• Denon DJ Controllers</li>
                  <li>• Behringer DJ Mixers</li>
                  <li>• Any MIDI-compatible DJ controller</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Connection Steps:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Connect your mixer via USB or MIDI</li>
                  <li>2. Ensure drivers are installed</li>
                  <li>3. Click "Reconnect" to detect hardware</li>
                  <li>4. Click "Go Live" to start broadcasting</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HardwareMixerControl;