import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Settings, 
  Activity, 
  Wifi, 
  CheckCircle, 
  AlertTriangle,
  Headphones,
  Mic,
  Volume2,
  Radio,
  Usb,
  Bluetooth,
  Cable
} from 'lucide-react';

interface MixerBrand {
  id: string;
  name: string;
  models: MixerModel[];
  software: string[];
  connectionTypes: ('USB' | 'Bluetooth' | 'Audio Interface' | 'MIDI')[];
}

interface MixerModel {
  id: string;
  name: string;
  channels: number;
  hasBuiltInInterface: boolean;
  supportedSoftware: string[];
  midiSupport: boolean;
  audioInterface: boolean;
}

interface HardwareConnection {
  isConnected: boolean;
  mixerBrand: string;
  mixerModel: string;
  connectionType: string;
  software: string;
  audioChannels: number;
  sampleRate: number;
  bufferSize: number;
  latency: number;
}

const HardwareMixerIntegration = () => {
  const { toast } = useToast();
  
  // Hardware mixer database
  const mixerBrands: MixerBrand[] = [
    {
      id: 'pioneer',
      name: 'Pioneer DJ',
      models: [
        { id: 'ddj-flx10', name: 'DDJ-FLX10', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Serato DJ Pro', 'rekordbox', 'Virtual DJ'], midiSupport: true, audioInterface: true },
        { id: 'ddj-rev7', name: 'DDJ-REV7', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Serato DJ Pro'], midiSupport: true, audioInterface: true },
        { id: 'djm-900nxs2', name: 'DJM-900NXS2', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['rekordbox', 'Serato DJ Pro'], midiSupport: true, audioInterface: true },
        { id: 'djm-a9', name: 'DJM-A9', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['rekordbox', 'Serato DJ Pro'], midiSupport: true, audioInterface: true }
      ],
      software: ['rekordbox', 'Serato DJ Pro', 'Virtual DJ'],
      connectionTypes: ['USB', 'Audio Interface', 'MIDI']
    },
    {
      id: 'numark',
      name: 'Numark',
      models: [
        { id: 'party-mix', name: 'Party Mix', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Serato DJ Lite', 'Virtual DJ'], midiSupport: true, audioInterface: true },
        { id: 'scratch', name: 'Scratch', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Serato DJ Pro'], midiSupport: true, audioInterface: true },
        { id: 'ns7iii', name: 'NS7III', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Serato DJ Pro'], midiSupport: true, audioInterface: true }
      ],
      software: ['Serato DJ Pro', 'Serato DJ Lite', 'Virtual DJ'],
      connectionTypes: ['USB', 'Audio Interface']
    },
    {
      id: 'denon',
      name: 'Denon DJ',
      models: [
        { id: 'prime-4', name: 'Prime 4', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Engine DJ', 'Serato DJ Pro', 'Virtual DJ'], midiSupport: true, audioInterface: true },
        { id: 'prime-go', name: 'Prime GO', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Engine DJ'], midiSupport: true, audioInterface: true },
        { id: 'x1800-prime', name: 'X1800 Prime', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Engine DJ', 'Serato DJ Pro'], midiSupport: true, audioInterface: true }
      ],
      software: ['Engine DJ', 'Serato DJ Pro', 'Virtual DJ'],
      connectionTypes: ['USB', 'Audio Interface', 'MIDI']
    },
    {
      id: 'native-instruments',
      name: 'Native Instruments',
      models: [
        { id: 'traktor-s4-mk3', name: 'Traktor Kontrol S4 MK3', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Traktor Pro 3'], midiSupport: true, audioInterface: true },
        { id: 'traktor-s2-mk3', name: 'Traktor Kontrol S2 MK3', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Traktor Pro 3'], midiSupport: true, audioInterface: true },
        { id: 'traktor-z2', name: 'Traktor Kontrol Z2', channels: 2, hasBuiltInInterface: true, supportedSoftware: ['Traktor Pro 3'], midiSupport: true, audioInterface: true }
      ],
      software: ['Traktor Pro 3'],
      connectionTypes: ['USB', 'Audio Interface', 'MIDI']
    },
    {
      id: 'hercules',
      name: 'Hercules',
      models: [
        { id: 'djcontrol-inpulse-500', name: 'DJControl Inpulse 500', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['djuced', 'Serato DJ Lite'], midiSupport: true, audioInterface: true },
        { id: 'djcontrol-flx6', name: 'DJControl FLX6', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['djuced'], midiSupport: true, audioInterface: true }
      ],
      software: ['djuced', 'Serato DJ Lite'],
      connectionTypes: ['USB', 'Audio Interface']
    },
    {
      id: 'behringer',
      name: 'Behringer',
      models: [
        { id: 'cmd-studio-4a', name: 'CMD Studio 4a', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Virtual DJ', 'Traktor'], midiSupport: true, audioInterface: true },
        { id: 'xenyx-x1204usb', name: 'Xenyx X1204USB', channels: 4, hasBuiltInInterface: true, supportedSoftware: ['Any DAW/Broadcasting Software'], midiSupport: false, audioInterface: true }
      ],
      software: ['Virtual DJ', 'Traktor', 'Any DAW/Broadcasting Software'],
      connectionTypes: ['USB', 'Audio Interface']
    }
  ];

  // State
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedSoftware, setSelectedSoftware] = useState<string>('');
  const [connectionType, setConnectionType] = useState<string>('USB');
  
  const [hardwareConnection, setHardwareConnection] = useState<HardwareConnection>({
    isConnected: false,
    mixerBrand: '',
    mixerModel: '',
    connectionType: '',
    software: '',
    audioChannels: 0,
    sampleRate: 44100,
    bufferSize: 512,
    latency: 0
  });

  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [midiDevices, setMidiDevices] = useState<any[]>([]);

  // Audio context for hardware integration
  const audioContextRef = useRef<AudioContext | null>(null);
  const hardwareInputRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Scan for available hardware
  const scanForHardware = useCallback(async () => {
    setIsScanning(true);
    
    try {
      // Scan for audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAvailableDevices(audioInputs);

      // Scan for MIDI devices
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = Array.from(midiAccess.inputs.values());
        setMidiDevices(inputs);
      }

      toast({
        title: 'Hardware Scan Complete',
        description: `Found ${audioInputs.length} audio devices and ${midiDevices.length} MIDI devices.`,
      });

    } catch (error) {
      console.error('Hardware scan failed:', error);
      toast({
        title: 'Hardware Scan Failed',
        description: 'Could not detect connected hardware devices.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  }, [midiDevices.length, toast]);

  // Connect to hardware mixer
  const connectToHardware = useCallback(async () => {
    if (!selectedBrand || !selectedModel || !selectedSoftware) {
      toast({
        title: 'Configuration Required',
        description: 'Please select your mixer brand, model, and software.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const brand = mixerBrands.find(b => b.id === selectedBrand);
      const model = brand?.models.find(m => m.id === selectedModel);
      
      if (!brand || !model) {
        throw new Error('Invalid mixer configuration');
      }

      // Initialize audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: hardwareConnection.sampleRate,
        latencyHint: 'interactive'
      });

      // Request audio input from mixer
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: hardwareConnection.sampleRate,
          channelCount: model.channels
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const source = audioContext.createMediaStreamSource(stream);

      // Connect to destination for monitoring
      source.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      hardwareInputRef.current = source;

      // Update connection state
      setHardwareConnection({
        isConnected: true,
        mixerBrand: brand.name,
        mixerModel: model.name,
        connectionType,
        software: selectedSoftware,
        audioChannels: model.channels,
        sampleRate: hardwareConnection.sampleRate,
        bufferSize: hardwareConnection.bufferSize,
        latency: audioContext.baseLatency * 1000 // Convert to ms
      });

      toast({
        title: '🎛️ Hardware Connected',
        description: `${brand.name} ${model.name} connected via ${connectionType}`,
      });

      // Launch software integration guide
      showSoftwareIntegrationGuide(selectedSoftware);

    } catch (error: any) {
      console.error('Hardware connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Could not connect to hardware mixer.',
        variant: 'destructive'
      });
    }
  }, [selectedBrand, selectedModel, selectedSoftware, connectionType, hardwareConnection.sampleRate, hardwareConnection.bufferSize, toast]);

  // Disconnect hardware
  const disconnectHardware = useCallback(() => {
    if (hardwareInputRef.current) {
      hardwareInputRef.current.disconnect();
      hardwareInputRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setHardwareConnection({
      isConnected: false,
      mixerBrand: '',
      mixerModel: '',
      connectionType: '',
      software: '',
      audioChannels: 0,
      sampleRate: 44100,
      bufferSize: 512,
      latency: 0
    });

    toast({
      title: 'Hardware Disconnected',
      description: 'Mixer has been disconnected from the system.',
    });
  }, [toast]);

  // Show software integration guide
  const showSoftwareIntegrationGuide = (software: string) => {
    const guides: Record<string, string> = {
      'rekordbox': 'Open rekordbox → Preferences → Audio → Select your mixer as audio device → Enable "Mix Rec Out" for broadcasting',
      'Serato DJ Pro': 'Open Serato DJ Pro → Setup → Audio → Select your mixer → Enable "Mix Out" and set to "Main Out" for broadcasting',
      'Traktor Pro 3': 'Open Traktor → Preferences → Audio Setup → Select your Kontrol device → Set "Output Routing" to "Mix Out" for broadcasting',
      'Engine DJ': 'Open Engine DJ → Settings → Audio → Select your Prime device → Enable "Mix Output" for broadcasting',
      'Virtual DJ': 'Open Virtual DJ → Settings → Audio → Select your mixer → Set "Master Output" to your mixer\'s main out',
      'djuced': 'Open djuced → Settings → Audio → Select Hercules device → Enable "Master Output" for broadcasting'
    };

    const guide = guides[software] || 'Configure your DJ software to route audio through the mixer\'s main output for broadcasting.';
    
    toast({
      title: `${software} Integration`,
      description: guide,
      duration: 10000
    });
  };

  // Get available models for selected brand
  const getAvailableModels = () => {
    const brand = mixerBrands.find(b => b.id === selectedBrand);
    return brand?.models || [];
  };

  // Get available software for selected model
  const getAvailableSoftware = () => {
    const brand = mixerBrands.find(b => b.id === selectedBrand);
    const model = brand?.models.find(m => m.id === selectedModel);
    return model?.supportedSoftware || [];
  };

  // Initialize hardware scanning on mount
  useEffect(() => {
    scanForHardware();
  }, [scanForHardware]);

  return (
    <div className="space-y-6">
      {/* Hardware Status */}
      <Card className={`glass-panel border-border/50 ${hardwareConnection.isConnected ? 'border-green-500 bg-green-50/50' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Hardware Mixer Integration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={hardwareConnection.isConnected ? "default" : "secondary"} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${hardwareConnection.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {hardwareConnection.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hardwareConnection.isConnected ? (
            <div className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Connect your professional DJ mixer to integrate with its official software for live broadcasting.
                </AlertDescription>
              </Alert>

              {/* Hardware Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Mixer Brand</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your mixer brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {mixerBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Mixer Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your mixer model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.channels} channels)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>DJ Software</Label>
                  <Select value={selectedSoftware} onValueChange={setSelectedSoftware} disabled={!selectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your DJ software" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSoftware().map((software) => (
                        <SelectItem key={software} value={software}>
                          {software}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Connection Type</Label>
                  <Select value={connectionType} onValueChange={setConnectionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USB">USB (Recommended)</SelectItem>
                      <SelectItem value="Audio Interface">Audio Interface</SelectItem>
                      <SelectItem value="MIDI">MIDI Control</SelectItem>
                      <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Available Devices */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    Audio Devices ({availableDevices.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {availableDevices.map((device, index) => (
                      <div key={device.deviceId} className="text-xs text-muted-foreground">
                        {device.label || `Audio Input ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    MIDI Devices ({midiDevices.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {midiDevices.map((device, index) => (
                      <div key={device.id} className="text-xs text-muted-foreground">
                        {device.name || `MIDI Device ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={scanForHardware}
                  disabled={isScanning}
                  variant="outline"
                  className="flex-1"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {isScanning ? 'Scanning...' : 'Scan Hardware'}
                </Button>
                <Button
                  onClick={connectToHardware}
                  disabled={!selectedBrand || !selectedModel || !selectedSoftware}
                  className="flex-1"
                >
                  <Usb className="h-4 w-4 mr-2" />
                  Connect Mixer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎛️ {hardwareConnection.mixerBrand} {hardwareConnection.mixerModel} connected via {hardwareConnection.connectionType}
                </AlertDescription>
              </Alert>

              {/* Connection Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Software:</span>
                    <span className="font-medium">{hardwareConnection.software}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Channels:</span>
                    <span className="font-medium">{hardwareConnection.audioChannels}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sample Rate:</span>
                    <span className="font-medium">{hardwareConnection.sampleRate} Hz</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Buffer Size:</span>
                    <span className="font-medium">{hardwareConnection.bufferSize} samples</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-medium">{hardwareConnection.latency.toFixed(1)} ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Connection:</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={disconnectHardware}
                variant="outline"
                className="w-full"
              >
                <Cable className="h-4 w-4 mr-2" />
                Disconnect Mixer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Software Integration Guide */}
      {hardwareConnection.isConnected && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              {hardwareConnection.software} Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  Your mixer is connected! Follow these steps to integrate with {hardwareConnection.software} for live broadcasting.
                </AlertDescription>
              </Alert>

              {/* Software-specific instructions */}
              <div className="space-y-3">
                {hardwareConnection.software === 'rekordbox' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2">rekordbox Setup:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open rekordbox and go to Preferences → Audio</li>
                      <li>Select your {hardwareConnection.mixerModel} as the audio device</li>
                      <li>Enable "Mix Rec Out" in the recording settings</li>
                      <li>Set the output routing to "Master Out" for broadcasting</li>
                      <li>Your mixer's main output will now feed into the broadcast system</li>
                    </ol>
                  </div>
                )}

                {hardwareConnection.software === 'Serato DJ Pro' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium mb-2">Serato DJ Pro Setup:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open Serato DJ Pro and go to Setup → Audio</li>
                      <li>Select your {hardwareConnection.mixerModel} from the device list</li>
                      <li>Enable "Mix Out" in the output settings</li>
                      <li>Set "Mix Out" to route to "Main Out" for broadcasting</li>
                      <li>The mixer's master output is now connected to your broadcast</li>
                    </ol>
                  </div>
                )}

                {hardwareConnection.software === 'Traktor Pro 3' && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium mb-2">Traktor Pro 3 Setup:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open Traktor and go to Preferences → Audio Setup</li>
                      <li>Select your Kontrol {hardwareConnection.mixerModel}</li>
                      <li>Set "Output Routing" to "Mix Out" for broadcasting</li>
                      <li>Enable "External Mixing Mode" if using an external mixer</li>
                      <li>Your hardware mixer now controls the broadcast output</li>
                    </ol>
                  </div>
                )}

                {hardwareConnection.software === 'Engine DJ' && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium mb-2">Engine DJ Setup:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open Engine DJ and go to Settings → Audio</li>
                      <li>Select your Prime {hardwareConnection.mixerModel}</li>
                      <li>Enable "Mix Output" for broadcasting</li>
                      <li>Set the master output to route to the broadcast system</li>
                      <li>Your Prime device now feeds audio to the live stream</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Broadcasting Tips */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Broadcasting Tips:
                </h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Keep your mixer's master volume at 75-85% to avoid clipping</li>
                  <li>Use the mixer's built-in limiter if available</li>
                  <li>Monitor your levels using both the mixer and broadcast VU meters</li>
                  <li>Test your setup before going live to ensure proper audio routing</li>
                  <li>Keep your DJ software's master output at unity gain (0dB)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HardwareMixerIntegration;