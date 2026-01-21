import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Cable, 
  Volume2, 
  Headphones, 
  Mic, 
  Music, 
  Radio, 
  Settings, 
  Activity, 
  Zap,
  ArrowRight,
  ArrowDown,
  Monitor,
  Wifi
} from 'lucide-react';

interface AudioRoute {
  id: string;
  name: string;
  source: AudioNode | null;
  destination: AudioNode | null;
  gainNode: GainNode | null;
  isActive: boolean;
  volume: number;
  isMuted: boolean;
}

interface AudioInput {
  id: string;
  name: string;
  type: 'microphone' | 'line' | 'usb' | 'bluetooth' | 'mixer_main' | 'mixer_cue';
  deviceId?: string;
  source: AudioNode | null;
  isActive: boolean;
  level: number;
}

interface AudioOutput {
  id: string;
  name: string;
  type: 'main' | 'monitor' | 'headphones' | 'stream' | 'record';
  destination: AudioNode | null;
  isActive: boolean;
  volume: number;
}

const AdvancedAudioRouting = () => {
  const { toast } = useToast();
  
  // Audio context and routing
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Audio inputs
  const [audioInputs, setAudioInputs] = useState<AudioInput[]>([
    { id: 'mic1', name: 'Microphone 1', type: 'microphone', source: null, isActive: false, level: 0 },
    { id: 'mic2', name: 'Microphone 2', type: 'microphone', source: null, isActive: false, level: 0 },
    { id: 'line1', name: 'Line Input 1', type: 'line', source: null, isActive: false, level: 0 },
    { id: 'line2', name: 'Line Input 2', type: 'line', source: null, isActive: false, level: 0 },
    { id: 'mixer_main', name: 'Mixer Main Out', type: 'mixer_main', source: null, isActive: false, level: 0 },
    { id: 'mixer_cue', name: 'Mixer Cue Out', type: 'mixer_cue', source: null, isActive: false, level: 0 },
    { id: 'usb1', name: 'USB Audio 1', type: 'usb', source: null, isActive: false, level: 0 },
    { id: 'bluetooth', name: 'Bluetooth Audio', type: 'bluetooth', source: null, isActive: false, level: 0 }
  ]);

  // Audio outputs
  const [audioOutputs, setAudioOutputs] = useState<AudioOutput[]>([
    { id: 'main', name: 'Main Output', type: 'main', destination: null, isActive: true, volume: 85 },
    { id: 'monitor', name: 'Monitor Output', type: 'monitor', destination: null, isActive: true, volume: 75 },
    { id: 'headphones', name: 'Headphones', type: 'headphones', destination: null, isActive: false, volume: 60 },
    { id: 'stream', name: 'Live Stream', type: 'stream', destination: null, isActive: false, volume: 90 },
    { id: 'record', name: 'Recording', type: 'record', destination: null, isActive: false, volume: 85 }
  ]);

  // Audio routes (input to output mappings)
  const [audioRoutes, setAudioRoutes] = useState<AudioRoute[]>([]);
  
  // Available audio devices
  const [availableInputDevices, setAvailableInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [availableOutputDevices, setAvailableOutputDevices] = useState<MediaDeviceInfo[]>([]);

  // Routing matrix state
  const [routingMatrix, setRoutingMatrix] = useState<Record<string, Record<string, boolean>>>({});

  // VU meters
  const [inputLevels, setInputLevels] = useState<Record<string, number>>({});
  const [outputLevels, setOutputLevels] = useState<Record<string, number>>({});
  const vuIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize advanced audio routing system
  const initializeAudioRouting = useCallback(async () => {
    try {
      // Create high-performance audio context
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Get available audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputDevices = devices.filter(device => device.kind === 'audioinput');
      const outputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      setAvailableInputDevices(inputDevices);
      setAvailableOutputDevices(outputDevices);

      // Create master routing nodes
      const masterGain = ctx.createGain();
      const monitorGain = ctx.createGain();
      const streamGain = ctx.createGain();
      const recordGain = ctx.createGain();

      // Connect to destinations
      masterGain.connect(ctx.destination);
      monitorGain.connect(ctx.destination);
      streamGain.connect(ctx.destination);
      recordGain.connect(ctx.destination);

      // Set initial volumes
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      monitorGain.gain.setValueAtTime(0.75, ctx.currentTime);
      streamGain.gain.setValueAtTime(0.9, ctx.currentTime);
      recordGain.gain.setValueAtTime(0.85, ctx.currentTime);

      // Update outputs with audio nodes
      setAudioOutputs(prev => prev.map(output => {
        let destination: AudioNode | null = null;
        switch (output.type) {
          case 'main': destination = masterGain; break;
          case 'monitor': destination = monitorGain; break;
          case 'stream': destination = streamGain; break;
          case 'record': destination = recordGain; break;
          default: destination = masterGain;
        }
        return { ...output, destination };
      }));

      setAudioContext(ctx);
      setIsInitialized(true);

      // Initialize routing matrix
      const matrix: Record<string, Record<string, boolean>> = {};
      audioInputs.forEach(input => {
        matrix[input.id] = {};
        audioOutputs.forEach(output => {
          matrix[input.id][output.id] = false;
        });
      });
      setRoutingMatrix(matrix);

      // Start VU meter monitoring
      startVUMonitoring(ctx);

      toast({
        title: 'Advanced Audio Routing Initialized',
        description: `Ready with ${inputDevices.length} inputs and ${outputDevices.length} outputs.`,
      });

    } catch (error: any) {
      console.error('Audio routing initialization failed:', error);
      toast({
        title: 'Audio Routing Failed',
        description: error.message || 'Could not initialize audio routing system.',
        variant: 'destructive'
      });
    }
  }, [audioInputs, audioOutputs, toast]);

  // Connect audio input
  const connectAudioInput = useCallback(async (inputId: string, deviceId?: string) => {
    if (!audioContext) return;

    const input = audioInputs.find(i => i.id === inputId);
    if (!input) return;

    try {
      let source: AudioNode;

      if (input.type === 'microphone' || input.type === 'line') {
        // Get microphone or line input
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: input.type === 'microphone',
            noiseSuppression: input.type === 'microphone',
            autoGainControl: false,
            sampleRate: 48000,
            channelCount: 2
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        source = audioContext.createMediaStreamSource(stream);

      } else if (input.type === 'mixer_main' || input.type === 'mixer_cue') {
        // Connect to mixer output (requires specific device selection)
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 48000,
            channelCount: 2
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        source = audioContext.createMediaStreamSource(stream);

      } else {
        // For USB and Bluetooth, use default audio input
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            deviceId: deviceId ? { exact: deviceId } : undefined,
            sampleRate: 48000 
          } 
        });
        source = audioContext.createMediaStreamSource(stream);
      }

      // Create gain node for this input
      const gainNode = audioContext.createGain();
      source.connect(gainNode);

      // Update input state
      setAudioInputs(prev => prev.map(i => 
        i.id === inputId 
          ? { ...i, source, isActive: true, deviceId }
          : i
      ));

      // Create route for this input
      const newRoute: AudioRoute = {
        id: `route_${inputId}`,
        name: `${input.name} Route`,
        source: gainNode,
        destination: null,
        gainNode,
        isActive: true,
        volume: 80,
        isMuted: false
      };

      setAudioRoutes(prev => [...prev.filter(r => r.id !== newRoute.id), newRoute]);

      toast({
        title: 'Audio Input Connected',
        description: `${input.name} is now active.`,
      });

    } catch (error: any) {
      console.error('Failed to connect audio input:', error);
      toast({
        title: 'Input Connection Failed',
        description: `Could not connect ${input.name}: ${error.message}`,
        variant: 'destructive'
      });
    }
  }, [audioContext, audioInputs, toast]);

  // Route input to output
  const routeAudio = useCallback((inputId: string, outputId: string, enabled: boolean) => {
    if (!audioContext) return;

    const input = audioInputs.find(i => i.id === inputId);
    const output = audioOutputs.find(o => o.id === outputId);
    const route = audioRoutes.find(r => r.id === `route_${inputId}`);

    if (!input || !output || !route || !route.gainNode || !output.destination) return;

    if (enabled) {
      // Connect input to output
      route.gainNode.connect(output.destination);
    } else {
      // Disconnect input from output
      try {
        route.gainNode.disconnect(output.destination);
      } catch (error) {
        // Already disconnected
      }
    }

    // Update routing matrix
    setRoutingMatrix(prev => ({
      ...prev,
      [inputId]: {
        ...prev[inputId],
        [outputId]: enabled
      }
    }));

    toast({
      title: enabled ? 'Route Connected' : 'Route Disconnected',
      description: `${input.name} ${enabled ? 'routed to' : 'disconnected from'} ${output.name}`,
    });
  }, [audioContext, audioInputs, audioOutputs, audioRoutes, toast]);

  // Update route volume
  const updateRouteVolume = useCallback((inputId: string, volume: number) => {
    const route = audioRoutes.find(r => r.id === `route_${inputId}`);
    if (!route || !route.gainNode || !audioContext) return;

    const normalizedVolume = volume / 100;
    route.gainNode.gain.setTargetAtTime(normalizedVolume, audioContext.currentTime, 0.01);

    setAudioRoutes(prev => prev.map(r => 
      r.id === `route_${inputId}` ? { ...r, volume } : r
    ));
  }, [audioRoutes, audioContext]);

  // Mute/unmute route
  const toggleRouteMute = useCallback((inputId: string) => {
    const route = audioRoutes.find(r => r.id === `route_${inputId}`);
    if (!route || !route.gainNode || !audioContext) return;

    const newMuteState = !route.isMuted;
    const targetGain = newMuteState ? 0 : route.volume / 100;
    
    route.gainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.01);

    setAudioRoutes(prev => prev.map(r => 
      r.id === `route_${inputId}` ? { ...r, isMuted: newMuteState } : r
    ));
  }, [audioRoutes, audioContext]);

  // Start VU meter monitoring
  const startVUMonitoring = useCallback((ctx: AudioContext) => {
    const analyserNodes: Record<string, AnalyserNode> = {};
    
    // Create analysers for active routes
    audioRoutes.forEach(route => {
      if (route.gainNode) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        route.gainNode.connect(analyser);
        analyserNodes[route.id] = analyser;
      }
    });

    // Update levels
    vuIntervalRef.current = setInterval(() => {
      const newInputLevels: Record<string, number> = {};
      const newOutputLevels: Record<string, number> = {};

      // Input levels
      Object.entries(analyserNodes).forEach(([routeId, analyser]) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const inputId = routeId.replace('route_', '');
        newInputLevels[inputId] = (average / 255) * 100;
      });

      setInputLevels(newInputLevels);
      setOutputLevels(newOutputLevels);
    }, 50);
  }, [audioRoutes]);

  // Get input icon
  const getInputIcon = (type: string) => {
    switch (type) {
      case 'microphone': return <Mic className="h-4 w-4" />;
      case 'line': return <Cable className="h-4 w-4" />;
      case 'mixer_main': return <Volume2 className="h-4 w-4" />;
      case 'mixer_cue': return <Headphones className="h-4 w-4" />;
      case 'usb': return <Zap className="h-4 w-4" />;
      case 'bluetooth': return <Wifi className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  // Get output icon
  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'main': return <Volume2 className="h-4 w-4" />;
      case 'monitor': return <Monitor className="h-4 w-4" />;
      case 'headphones': return <Headphones className="h-4 w-4" />;
      case 'stream': return <Radio className="h-4 w-4" />;
      case 'record': return <Activity className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vuIntervalRef.current) {
        clearInterval(vuIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Audio Routing Status */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cable className="h-6 w-6" />
              Advanced Audio Routing
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? 'READY' : 'OFFLINE'}
              </Badge>
              {!isInitialized && (
                <Button onClick={initializeAudioRouting} size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Routing
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isInitialized ? (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Initialize the advanced audio routing system to connect hardware mixers, microphones, and other audio sources to multiple outputs.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{audioInputs.filter(i => i.isActive).length}</div>
                <p className="text-sm text-muted-foreground">Active Inputs</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{audioRoutes.filter(r => r.isActive).length}</div>
                <p className="text-sm text-muted-foreground">Active Routes</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{audioOutputs.filter(o => o.isActive).length}</div>
                <p className="text-sm text-muted-foreground">Active Outputs</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isInitialized && (
        <>
          {/* Audio Inputs */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Audio Inputs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {audioInputs.map((input) => (
                  <div key={input.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getInputIcon(input.type)}
                        <span className="text-sm font-medium">{input.name}</span>
                      </div>
                      <Badge variant={input.isActive ? "default" : "secondary"}>
                        {input.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {/* Device Selection */}
                    <div className="mb-2">
                      <Select 
                        value={input.deviceId || ''} 
                        onValueChange={(deviceId) => connectAudioInput(input.id, deviceId)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInputDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Input ${device.deviceId.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* VU Meter */}
                    <div className="h-16 w-4 mx-auto bg-gray-200 rounded-full relative overflow-hidden mb-2">
                      <div 
                        className="absolute bottom-0 w-full bg-green-500 transition-all duration-100"
                        style={{ height: `${Math.min(inputLevels[input.id] || 0, 100)}%` }}
                      />
                    </div>

                    {/* Route Controls */}
                    {input.isActive && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => toggleRouteMute(input.id)}
                            size="sm"
                            variant={audioRoutes.find(r => r.id === `route_${input.id}`)?.isMuted ? "destructive" : "outline"}
                            className="flex-1"
                          >
                            {audioRoutes.find(r => r.id === `route_${input.id}`)?.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          </Button>
                        </div>
                        <Slider
                          value={[audioRoutes.find(r => r.id === `route_${input.id}`)?.volume || 80]}
                          onValueChange={([value]) => updateRouteVolume(input.id, value)}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Routing Matrix */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audio Routing Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Input / Output</th>
                      {audioOutputs.map((output) => (
                        <th key={output.id} className="text-center p-2 min-w-24">
                          <div className="flex flex-col items-center gap-1">
                            {getOutputIcon(output.type)}
                            <span className="text-xs">{output.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {audioInputs.filter(input => input.isActive).map((input) => (
                      <tr key={input.id} className="border-t">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getInputIcon(input.type)}
                            <span className="text-sm">{input.name}</span>
                          </div>
                        </td>
                        {audioOutputs.map((output) => (
                          <td key={output.id} className="text-center p-2">
                            <Switch
                              checked={routingMatrix[input.id]?.[output.id] || false}
                              onCheckedChange={(checked) => routeAudio(input.id, output.id, checked)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Audio Outputs */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Audio Outputs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {audioOutputs.map((output) => (
                  <div key={output.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getOutputIcon(output.type)}
                        <span className="text-sm font-medium">{output.name}</span>
                      </div>
                      <Badge variant={output.isActive ? "default" : "secondary"}>
                        {output.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {/* Output Level */}
                    <div className="h-16 w-4 mx-auto bg-gray-200 rounded-full relative overflow-hidden mb-2">
                      <div 
                        className="absolute bottom-0 w-full bg-blue-500 transition-all duration-100"
                        style={{ height: `${Math.min(outputLevels[output.id] || 0, 100)}%` }}
                      />
                    </div>

                    {/* Volume Control */}
                    <div className="space-y-2">
                      <Slider
                        value={[output.volume]}
                        onValueChange={([value]) => {
                          setAudioOutputs(prev => prev.map(o => 
                            o.id === output.id ? { ...o, volume: value } : o
                          ));
                        }}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-center font-mono">{output.volume}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvancedAudioRouting;