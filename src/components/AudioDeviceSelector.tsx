import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic, Volume2, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface AudioDeviceSelectorProps {
  onDeviceSelect?: (deviceId: string) => void;
  selectedDeviceId?: string;
}

const AudioDeviceSelector = ({ onDeviceSelect, selectedDeviceId }: AudioDeviceSelectorProps) => {
  const { toast } = useToast();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);

  // Load available audio devices
  const loadAudioDevices = async () => {
    setLoading(true);
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Input ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));
      
      setAudioDevices(audioInputs);
      
      if (audioInputs.length === 0) {
        toast({
          title: "No Audio Devices",
          description: "No audio input devices found. Please connect your mixer or microphone.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading audio devices:', error);
      toast({
        title: "Device Access Error",
        description: "Could not access audio devices. Please check permissions.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Test audio device
  const testAudioDevice = async (deviceId: string) => {
    setTestingAudio(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false
        }
      });
      
      // Create audio context to analyze input
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Monitor audio levels for 3 seconds
      let maxLevel = 0;
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const level = Math.max(...dataArray);
        maxLevel = Math.max(maxLevel, level);
      };
      
      const interval = setInterval(checkAudio, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        if (maxLevel > 10) {
          toast({
            title: "Audio Test Success",
            description: `Audio detected! Peak level: ${Math.round(maxLevel/255*100)}%`,
          });
        } else {
          toast({
            title: "No Audio Detected",
            description: "No audio signal detected. Check your mixer output and connections.",
            variant: "destructive"
          });
        }
        
        setTestingAudio(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error testing audio device:', error);
      toast({
        title: "Audio Test Failed",
        description: "Could not test audio device. It may be in use by another application.",
        variant: "destructive"
      });
      setTestingAudio(false);
    }
  };

  // Load devices on component mount
  useEffect(() => {
    loadAudioDevices();
  }, []);

  // Detect device type for better labeling
  const getDeviceType = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('cable') || lowerLabel.includes('virtual')) {
      return 'virtual';
    }
    if (lowerLabel.includes('mixer') || lowerLabel.includes('interface')) {
      return 'mixer';
    }
    if (lowerLabel.includes('usb')) {
      return 'usb';
    }
    return 'microphone';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Settings className="h-4 w-4" />;
      case 'mixer':
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Mic className="h-4 w-4" />;
    }
  };

  const getDeviceBadge = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Badge variant="secondary">Virtual Cable</Badge>;
      case 'mixer':
        return <Badge variant="default">Mixer/Interface</Badge>;
      case 'usb':
        return <Badge variant="outline">USB Device</Badge>;
      default:
        return <Badge variant="outline">Microphone</Badge>;
    }
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Volume2 className="h-5 w-5 text-primary" />
            Audio Input Selection
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAudioDevices}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioDevices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Mic className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No audio devices found</p>
            <p className="text-sm">Connect your mixer or enable virtual audio cable</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Select value={selectedDeviceId} onValueChange={onDeviceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select audio input device" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((device) => {
                  const deviceType = getDeviceType(device.label);
                  return (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(deviceType)}
                        <span className="truncate">{device.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Device List with Details */}
            <div className="space-y-2">
              {audioDevices.map((device) => {
                const deviceType = getDeviceType(device.label);
                const isSelected = device.deviceId === selectedDeviceId;
                
                return (
                  <div
                    key={device.deviceId}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getDeviceIcon(deviceType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{device.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getDeviceBadge(deviceType)}
                            {isSelected && (
                              <Badge variant="default" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testAudioDevice(device.deviceId)}
                        disabled={testingAudio}
                        className="gap-2"
                      >
                        <Volume2 className="h-3 w-3" />
                        {testingAudio ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/30">
          <h4 className="font-medium mb-2">For Hardware Mixer Recording:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Install virtual audio cable software (VB-Audio Cable)</li>
            <li>• Connect mixer output to audio interface</li>
            <li>• Route audio interface to virtual cable</li>
            <li>• Select virtual cable as input device above</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioDeviceSelector;