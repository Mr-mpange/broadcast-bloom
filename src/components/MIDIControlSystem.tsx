import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Activity, 
  Zap, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic,
  Headphones,
  Radio,
  Gamepad2
} from 'lucide-react';

interface MIDIMapping {
  id: string;
  name: string;
  midiChannel: number;
  controlType: 'fader' | 'knob' | 'button' | 'encoder';
  ccNumber: number;
  minValue: number;
  maxValue: number;
  currentValue: number;
  action: string;
  isLearning: boolean;
}

interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  isConnected: boolean;
  input?: any; // WebMidi.MIDIInput
  output?: any; // WebMidi.MIDIOutput
}

const MIDIControlSystem = () => {
  const { toast } = useToast();
  
  // MIDI State
  const [midiAccess, setMidiAccess] = useState<any | null>(null);
  const [midiDevices, setMidiDevices] = useState<MIDIDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [learningControl, setLearningControl] = useState<string>('');

  // MIDI Mappings for common mixer controls
  const [midiMappings, setMidiMappings] = useState<MIDIMapping[]>([
    // Channel Faders
    { id: 'ch1-fader', name: 'Channel 1 Fader', midiChannel: 1, controlType: 'fader', ccNumber: 7, minValue: 0, maxValue: 127, currentValue: 85, action: 'channel1_volume', isLearning: false },
    { id: 'ch2-fader', name: 'Channel 2 Fader', midiChannel: 1, controlType: 'fader', ccNumber: 8, minValue: 0, maxValue: 127, currentValue: 85, action: 'channel2_volume', isLearning: false },
    { id: 'ch3-fader', name: 'Channel 3 Fader', midiChannel: 1, controlType: 'fader', ccNumber: 9, minValue: 0, maxValue: 127, currentValue: 0, action: 'channel3_volume', isLearning: false },
    { id: 'ch4-fader', name: 'Channel 4 Fader', midiChannel: 1, controlType: 'fader', ccNumber: 10, minValue: 0, maxValue: 127, currentValue: 0, action: 'channel4_volume', isLearning: false },
    
    // Master Controls
    { id: 'master-fader', name: 'Master Fader', midiChannel: 1, controlType: 'fader', ccNumber: 14, minValue: 0, maxValue: 127, currentValue: 100, action: 'master_volume', isLearning: false },
    { id: 'crossfader', name: 'Crossfader', midiChannel: 1, controlType: 'fader', ccNumber: 15, minValue: 0, maxValue: 127, currentValue: 64, action: 'crossfader', isLearning: false },
    
    // EQ Controls
    { id: 'ch1-high', name: 'Ch1 High EQ', midiChannel: 1, controlType: 'knob', ccNumber: 16, minValue: 0, maxValue: 127, currentValue: 64, action: 'channel1_eq_high', isLearning: false },
    { id: 'ch1-mid', name: 'Ch1 Mid EQ', midiChannel: 1, controlType: 'knob', ccNumber: 17, minValue: 0, maxValue: 127, currentValue: 64, action: 'channel1_eq_mid', isLearning: false },
    { id: 'ch1-low', name: 'Ch1 Low EQ', midiChannel: 1, controlType: 'knob', ccNumber: 18, minValue: 0, maxValue: 127, currentValue: 64, action: 'channel1_eq_low', isLearning: false },
    
    // Transport Controls
    { id: 'play-pause', name: 'Play/Pause', midiChannel: 1, controlType: 'button', ccNumber: 32, minValue: 0, maxValue: 127, currentValue: 0, action: 'transport_play_pause', isLearning: false },
    { id: 'cue-next', name: 'Cue Next', midiChannel: 1, controlType: 'button', ccNumber: 33, minValue: 0, maxValue: 127, currentValue: 0, action: 'transport_next', isLearning: false },
    { id: 'cue-prev', name: 'Cue Previous', midiChannel: 1, controlType: 'button', ccNumber: 34, minValue: 0, maxValue: 127, currentValue: 0, action: 'transport_previous', isLearning: false },
    
    // Channel Mutes
    { id: 'ch1-mute', name: 'Ch1 Mute', midiChannel: 1, controlType: 'button', ccNumber: 48, minValue: 0, maxValue: 127, currentValue: 0, action: 'channel1_mute', isLearning: false },
    { id: 'ch2-mute', name: 'Ch2 Mute', midiChannel: 1, controlType: 'button', ccNumber: 49, minValue: 0, maxValue: 127, currentValue: 0, action: 'channel2_mute', isLearning: false },
    
    // Broadcast Controls
    { id: 'mic-on-air', name: 'Mic On Air', midiChannel: 1, controlType: 'button', ccNumber: 64, minValue: 0, maxValue: 127, currentValue: 0, action: 'microphone_toggle', isLearning: false },
    { id: 'go-live', name: 'Go Live', midiChannel: 1, controlType: 'button', ccNumber: 65, minValue: 0, maxValue: 127, currentValue: 0, action: 'broadcast_toggle', isLearning: false }
  ]);

  // Audio context for real-time processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingNodesRef = useRef<Map<string, GainNode>>(new Map());

  // Initialize MIDI
  const initializeMIDI = useCallback(async () => {
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API not supported in this browser');
      }

      const access = await navigator.requestMIDIAccess({ sysex: false });
      setMidiAccess(access);

      // Get available devices
      const devices: MIDIDevice[] = [];
      
      // Input devices
      access.inputs.forEach((input) => {
        devices.push({
          id: input.id,
          name: input.name || 'Unknown MIDI Device',
          manufacturer: input.manufacturer || 'Unknown',
          isConnected: input.state === 'connected',
          input
        });
      });

      // Output devices
      access.outputs.forEach((output) => {
        const existingDevice = devices.find(d => d.name === output.name);
        if (existingDevice) {
          existingDevice.output = output;
        } else {
          devices.push({
            id: output.id,
            name: output.name || 'Unknown MIDI Device',
            manufacturer: output.manufacturer || 'Unknown',
            isConnected: output.state === 'connected',
            output
          });
        }
      });

      setMidiDevices(devices);

      // Listen for device changes
      access.onstatechange = (event) => {
        console.log('MIDI device state changed:', event);
        // Refresh device list
        initializeMIDI();
      };

      toast({
        title: 'MIDI System Initialized',
        description: `Found ${devices.length} MIDI devices.`,
      });

    } catch (error: any) {
      console.error('MIDI initialization failed:', error);
      toast({
        title: 'MIDI Initialization Failed',
        description: error.message || 'Could not access MIDI devices.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Connect to MIDI device
  const connectMIDIDevice = useCallback((deviceId: string) => {
    const device = midiDevices.find(d => d.id === deviceId);
    if (!device || !device.input) return;

    // Set up MIDI message handler
    device.input.onmidimessage = (message) => {
      const [status, data1, data2] = message.data;
      const messageType = status & 0xF0;
      const channel = (status & 0x0F) + 1;

      // Handle Control Change messages (CC)
      if (messageType === 0xB0) {
        handleMIDIControlChange(channel, data1, data2);
      }
      // Handle Note On/Off for buttons
      else if (messageType === 0x90 || messageType === 0x80) {
        const velocity = messageType === 0x90 ? data2 : 0;
        handleMIDINote(channel, data1, velocity);
      }
    };

    setSelectedDevice(deviceId);
    
    toast({
      title: 'MIDI Device Connected',
      description: `Connected to ${device.name}`,
    });
  }, [midiDevices]);

  // Handle MIDI Control Change messages
  const handleMIDIControlChange = useCallback((channel: number, ccNumber: number, value: number) => {
    if (isLearningMode && learningControl) {
      // Learn new MIDI mapping
      setMidiMappings(prev => prev.map(mapping => 
        mapping.id === learningControl 
          ? { ...mapping, midiChannel: channel, ccNumber, currentValue: value, isLearning: false }
          : mapping
      ));
      setIsLearningMode(false);
      setLearningControl('');
      
      toast({
        title: 'MIDI Mapping Learned',
        description: `Mapped CC${ccNumber} on channel ${channel}`,
      });
      return;
    }

    // Find existing mapping
    const mapping = midiMappings.find(m => m.midiChannel === channel && m.ccNumber === ccNumber);
    if (!mapping) return;

    // Update mapping value
    setMidiMappings(prev => prev.map(m => 
      m.id === mapping.id ? { ...m, currentValue: value } : m
    ));

    // Execute the mapped action
    executeMIDIAction(mapping.action, value);
  }, [isLearningMode, learningControl, midiMappings]);

  // Handle MIDI Note messages (for buttons)
  const handleMIDINote = useCallback((channel: number, note: number, velocity: number) => {
    // Find button mapping (using note as CC number for simplicity)
    const mapping = midiMappings.find(m => 
      m.midiChannel === channel && 
      m.ccNumber === note && 
      m.controlType === 'button'
    );
    
    if (!mapping) return;

    // Only trigger on note on (velocity > 0)
    if (velocity > 0) {
      executeMIDIAction(mapping.action, 127);
    }
  }, [midiMappings]);

  // Execute MIDI-mapped actions
  const executeMIDIAction = useCallback((action: string, value: number) => {
    const normalizedValue = value / 127; // Normalize to 0-1

    switch (action) {
      case 'master_volume':
        // Update master volume
        if (audioContextRef.current && processingNodesRef.current.has('master')) {
          const masterGain = processingNodesRef.current.get('master')!;
          masterGain.gain.setTargetAtTime(normalizedValue, audioContextRef.current.currentTime, 0.01);
        }
        break;

      case 'channel1_volume':
      case 'channel2_volume':
      case 'channel3_volume':
      case 'channel4_volume':
        const channelNumber = action.replace('channel', '').replace('_volume', '');
        if (audioContextRef.current && processingNodesRef.current.has(`channel${channelNumber}`)) {
          const channelGain = processingNodesRef.current.get(`channel${channelNumber}`)!;
          channelGain.gain.setTargetAtTime(normalizedValue, audioContextRef.current.currentTime, 0.01);
        }
        break;

      case 'channel1_mute':
      case 'channel2_mute':
        const muteChannelNumber = action.replace('channel', '').replace('_mute', '');
        if (audioContextRef.current && processingNodesRef.current.has(`channel${muteChannelNumber}`)) {
          const channelGain = processingNodesRef.current.get(`channel${muteChannelNumber}`)!;
          const currentGain = channelGain.gain.value;
          const newGain = currentGain > 0 ? 0 : 0.8; // Toggle mute
          channelGain.gain.setTargetAtTime(newGain, audioContextRef.current.currentTime, 0.01);
        }
        break;

      case 'transport_play_pause':
        // Trigger play/pause action
        document.dispatchEvent(new CustomEvent('midi-transport-play-pause'));
        break;

      case 'transport_next':
        document.dispatchEvent(new CustomEvent('midi-transport-next'));
        break;

      case 'transport_previous':
        document.dispatchEvent(new CustomEvent('midi-transport-previous'));
        break;

      case 'microphone_toggle':
        document.dispatchEvent(new CustomEvent('midi-microphone-toggle'));
        break;

      case 'broadcast_toggle':
        document.dispatchEvent(new CustomEvent('midi-broadcast-toggle'));
        break;

      default:
        console.log(`MIDI action not implemented: ${action}`, value);
    }
  }, []);

  // Start MIDI learning mode
  const startLearning = (mappingId: string) => {
    setIsLearningMode(true);
    setLearningControl(mappingId);
    setMidiMappings(prev => prev.map(m => 
      m.id === mappingId ? { ...m, isLearning: true } : { ...m, isLearning: false }
    ));
    
    toast({
      title: 'MIDI Learning Mode',
      description: 'Move a control on your mixer to map it.',
    });
  };

  // Cancel learning mode
  const cancelLearning = () => {
    setIsLearningMode(false);
    setLearningControl('');
    setMidiMappings(prev => prev.map(m => ({ ...m, isLearning: false })));
  };

  // Initialize audio processing nodes
  const initializeAudioProcessing = useCallback(async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Create processing nodes
      const masterGain = audioContext.createGain();
      const channel1Gain = audioContext.createGain();
      const channel2Gain = audioContext.createGain();
      const channel3Gain = audioContext.createGain();
      const channel4Gain = audioContext.createGain();

      // Set initial values
      masterGain.gain.setValueAtTime(0.8, audioContext.currentTime);
      channel1Gain.gain.setValueAtTime(0.8, audioContext.currentTime);
      channel2Gain.gain.setValueAtTime(0.8, audioContext.currentTime);
      channel3Gain.gain.setValueAtTime(0, audioContext.currentTime);
      channel4Gain.gain.setValueAtTime(0, audioContext.currentTime);

      // Connect processing chain
      channel1Gain.connect(masterGain);
      channel2Gain.connect(masterGain);
      channel3Gain.connect(masterGain);
      channel4Gain.connect(masterGain);
      masterGain.connect(audioContext.destination);

      // Store references
      audioContextRef.current = audioContext;
      processingNodesRef.current.set('master', masterGain);
      processingNodesRef.current.set('channel1', channel1Gain);
      processingNodesRef.current.set('channel2', channel2Gain);
      processingNodesRef.current.set('channel3', channel3Gain);
      processingNodesRef.current.set('channel4', channel4Gain);

    } catch (error) {
      console.error('Audio processing initialization failed:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMIDI();
    initializeAudioProcessing();
  }, [initializeMIDI, initializeAudioProcessing]);

  // Get control icon
  const getControlIcon = (controlType: string) => {
    switch (controlType) {
      case 'fader': return <Volume2 className="h-4 w-4" />;
      case 'knob': return <Settings className="h-4 w-4" />;
      case 'button': return <Zap className="h-4 w-4" />;
      case 'encoder': return <Activity className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* MIDI Status */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              MIDI Control System
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={selectedDevice ? "default" : "secondary"}>
                {selectedDevice ? 'CONNECTED' : 'DISCONNECTED'}
              </Badge>
              {isLearningMode && (
                <Badge variant="destructive" className="animate-pulse">
                  LEARNING
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Device Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Available MIDI Devices</Label>
              <div className="grid gap-2">
                {midiDevices.length > 0 ? (
                  midiDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.manufacturer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.isConnected ? "default" : "secondary"}>
                          {device.isConnected ? 'Available' : 'Offline'}
                        </Badge>
                        <Button
                          onClick={() => connectMIDIDevice(device.id)}
                          disabled={!device.isConnected || selectedDevice === device.id}
                          size="sm"
                        >
                          {selectedDevice === device.id ? 'Connected' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <Gamepad2 className="h-4 w-4" />
                    <AlertDescription>
                      No MIDI devices found. Connect your mixer and refresh the page.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Learning Mode Controls */}
            {selectedDevice && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsLearningMode(!isLearningMode)}
                  variant={isLearningMode ? "destructive" : "outline"}
                  className="flex-1"
                >
                  {isLearningMode ? 'Cancel Learning' : 'Learn MIDI Controls'}
                </Button>
                <Button onClick={initializeMIDI} variant="outline">
                  Refresh Devices
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MIDI Mappings */}
      {selectedDevice && (
        <div className="grid gap-4">
          {/* Channel Controls */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Channel Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {midiMappings.filter(m => m.action.includes('channel')).map((mapping) => (
                  <div key={mapping.id} className={`p-3 border rounded-lg ${mapping.isLearning ? 'border-red-500 bg-red-50' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getControlIcon(mapping.controlType)}
                        <span className="text-sm font-medium">{mapping.name}</span>
                      </div>
                      <Button
                        onClick={() => startLearning(mapping.id)}
                        disabled={isLearningMode && learningControl !== mapping.id}
                        size="sm"
                        variant="ghost"
                      >
                        {mapping.isLearning ? 'Learning...' : 'Learn'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        CC{mapping.ccNumber} • Ch{mapping.midiChannel}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                          style={{ width: `${(mapping.currentValue / 127) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-mono text-center">
                        {mapping.currentValue}/127
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Master Controls */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Master & Transport Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {midiMappings.filter(m => m.action.includes('master') || m.action.includes('transport') || m.action.includes('broadcast') || m.action.includes('microphone')).map((mapping) => (
                  <div key={mapping.id} className={`p-3 border rounded-lg ${mapping.isLearning ? 'border-red-500 bg-red-50' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getControlIcon(mapping.controlType)}
                        <span className="text-sm font-medium">{mapping.name}</span>
                      </div>
                      <Button
                        onClick={() => startLearning(mapping.id)}
                        disabled={isLearningMode && learningControl !== mapping.id}
                        size="sm"
                        variant="ghost"
                      >
                        {mapping.isLearning ? 'Learning...' : 'Learn'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        CC{mapping.ccNumber} • Ch{mapping.midiChannel}
                      </div>
                      {mapping.controlType === 'button' ? (
                        <div className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${
                          mapping.currentValue > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {mapping.currentValue > 0 ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                      ) : (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                              style={{ width: `${(mapping.currentValue / 127) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs font-mono text-center">
                            {mapping.currentValue}/127
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MIDI Learning Instructions */}
      {isLearningMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>MIDI Learning Active:</strong> Move the control on your mixer that you want to map to "{midiMappings.find(m => m.id === learningControl)?.name}". 
            The system will automatically detect and map the MIDI message.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MIDIControlSystem;