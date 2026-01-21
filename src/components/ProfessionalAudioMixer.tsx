import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Music, 
  Headphones,
  Settings,
  Activity,
  Zap,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';

interface AudioChannel {
  id: string;
  name: string;
  type: 'microphone' | 'music' | 'jingle' | 'external';
  source: AudioNode | null;
  gainNode: GainNode | null;
  volume: number;
  isMuted: boolean;
  isActive: boolean;
  isPFL: boolean; // Pre-Fade Listen
  eq: {
    high: number;
    mid: number;
    low: number;
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

interface MasterSection {
  volume: number;
  isMuted: boolean;
  limiter: {
    enabled: boolean;
    threshold: number;
  };
  eq: {
    high: number;
    mid: number;
    low: number;
  };
}

const ProfessionalAudioMixer = () => {
  const { toast } = useToast();
  
  // Audio context and nodes
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [masterGainNode, setMasterGainNode] = useState<GainNode | null>(null);
  const [masterLimiterNode, setMasterLimiterNode] = useState<DynamicsCompressorNode | null>(null);
  const [masterEQNodes, setMasterEQNodes] = useState<{
    high: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    low: BiquadFilterNode | null;
  }>({ high: null, mid: null, low: null });

  // Mixer state
  const [channels, setChannels] = useState<AudioChannel[]>([
    {
      id: 'mic1',
      name: 'Microphone 1',
      type: 'microphone',
      source: null,
      gainNode: null,
      volume: 75,
      isMuted: false,
      isActive: false,
      isPFL: false,
      eq: { high: 0, mid: 0, low: 0 },
      compressor: { enabled: true, threshold: -18, ratio: 4, attack: 0.003, release: 0.1 }
    },
    {
      id: 'mic2',
      name: 'Microphone 2',
      type: 'microphone',
      source: null,
      gainNode: null,
      volume: 75,
      isMuted: true,
      isActive: false,
      isPFL: false,
      eq: { high: 0, mid: 0, low: 0 },
      compressor: { enabled: true, threshold: -18, ratio: 4, attack: 0.003, release: 0.1 }
    },
    {
      id: 'music1',
      name: 'Music Player 1',
      type: 'music',
      source: null,
      gainNode: null,
      volume: 80,
      isMuted: false,
      isActive: false,
      isPFL: false,
      eq: { high: 0, mid: 0, low: 0 },
      compressor: { enabled: false, threshold: -12, ratio: 2, attack: 0.01, release: 0.2 }
    },
    {
      id: 'music2',
      name: 'Music Player 2',
      type: 'music',
      source: null,
      gainNode: null,
      volume: 80,
      isMuted: true,
      isActive: false,
      isPFL: false,
      eq: { high: 0, mid: 0, low: 0 },
      compressor: { enabled: false, threshold: -12, ratio: 2, attack: 0.01, release: 0.2 }
    },
    {
      id: 'jingles',
      name: 'Jingles & SFX',
      type: 'jingle',
      source: null,
      gainNode: null,
      volume: 85,
      isMuted: false,
      isActive: false,
      isPFL: false,
      eq: { high: 2, mid: 0, low: -1 },
      compressor: { enabled: true, threshold: -6, ratio: 8, attack: 0.001, release: 0.05 }
    },
    {
      id: 'external',
      name: 'External Input',
      type: 'external',
      source: null,
      gainNode: null,
      volume: 70,
      isMuted: true,
      isActive: false,
      isPFL: false,
      eq: { high: 0, mid: 0, low: 0 },
      compressor: { enabled: false, threshold: -15, ratio: 3, attack: 0.005, release: 0.15 }
    }
  ]);

  const [masterSection, setMasterSection] = useState<MasterSection>({
    volume: 85,
    isMuted: false,
    limiter: { enabled: true, threshold: -1 },
    eq: { high: 0, mid: 0, low: 0 }
  });

  // VU meters
  const [vuLevels, setVuLevels] = useState<Record<string, number>>({});
  const [masterVuLevel, setMasterVuLevel] = useState(0);
  const vuIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize professional audio mixer
  const initializeMixer = useCallback(async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Create master section
      const masterGain = ctx.createGain();
      const masterLimiter = ctx.createDynamicsCompressor();
      
      // Master EQ
      const highShelf = ctx.createBiquadFilter();
      const midPeaking = ctx.createBiquadFilter();
      const lowShelf = ctx.createBiquadFilter();

      // Configure master EQ
      highShelf.type = 'highshelf';
      highShelf.frequency.setValueAtTime(8000, ctx.currentTime);
      
      midPeaking.type = 'peaking';
      midPeaking.frequency.setValueAtTime(1000, ctx.currentTime);
      midPeaking.Q.setValueAtTime(1, ctx.currentTime);
      
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.setValueAtTime(100, ctx.currentTime);

      // Configure master limiter
      masterLimiter.threshold.setValueAtTime(-1, ctx.currentTime);
      masterLimiter.knee.setValueAtTime(0, ctx.currentTime);
      masterLimiter.ratio.setValueAtTime(20, ctx.currentTime);
      masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime);
      masterLimiter.release.setValueAtTime(0.01, ctx.currentTime);

      // Connect master chain: EQ → Gain → Limiter → Destination
      lowShelf.connect(midPeaking);
      midPeaking.connect(highShelf);
      highShelf.connect(masterGain);
      masterGain.connect(masterLimiter);
      masterLimiter.connect(ctx.destination);

      setAudioContext(ctx);
      setMasterGainNode(masterGain);
      setMasterLimiterNode(masterLimiter);
      setMasterEQNodes({ high: highShelf, mid: midPeaking, low: lowShelf });

      // Initialize channel processing
      const updatedChannels = await Promise.all(channels.map(async (channel) => {
        const channelGain = ctx.createGain();
        
        // Create channel EQ
        const channelHigh = ctx.createBiquadFilter();
        const channelMid = ctx.createBiquadFilter();
        const channelLow = ctx.createBiquadFilter();
        
        channelHigh.type = 'highshelf';
        channelHigh.frequency.setValueAtTime(8000, ctx.currentTime);
        
        channelMid.type = 'peaking';
        channelMid.frequency.setValueAtTime(1000, ctx.currentTime);
        channelMid.Q.setValueAtTime(1, ctx.currentTime);
        
        channelLow.type = 'lowshelf';
        channelLow.frequency.setValueAtTime(100, ctx.currentTime);

        // Connect channel processing chain
        channelLow.connect(channelMid);
        channelMid.connect(channelHigh);
        channelHigh.connect(channelGain);
        channelGain.connect(lowShelf); // Connect to master EQ input

        // Set initial volume
        channelGain.gain.setValueAtTime(channel.volume / 100, ctx.currentTime);

        return {
          ...channel,
          gainNode: channelGain
        };
      }));

      setChannels(updatedChannels);

      // Start VU meter monitoring
      startVUMetering(ctx, updatedChannels, masterGain);

      toast({
        title: 'Professional Mixer Initialized',
        description: 'All channels and processing ready for broadcast.',
      });

    } catch (error) {
      console.error('Mixer initialization failed:', error);
      toast({
        title: 'Mixer Initialization Failed',
        description: 'Could not initialize professional audio mixer.',
        variant: 'destructive'
      });
    }
  }, [channels, toast]);

  // Start VU meter monitoring
  const startVUMetering = (ctx: AudioContext, channelList: AudioChannel[], masterGain: GainNode) => {
    const analyserNodes: Record<string, AnalyserNode> = {};
    
    // Create analysers for each channel
    channelList.forEach(channel => {
      if (channel.gainNode) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        channel.gainNode.connect(analyser);
        analyserNodes[channel.id] = analyser;
      }
    });

    // Create master analyser
    const masterAnalyser = ctx.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterGain.connect(masterAnalyser);

    // Update VU levels
    vuIntervalRef.current = setInterval(() => {
      const newVuLevels: Record<string, number> = {};

      // Channel levels
      Object.entries(analyserNodes).forEach(([channelId, analyser]) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        newVuLevels[channelId] = (average / 255) * 100;
      });

      // Master level
      const masterDataArray = new Uint8Array(masterAnalyser.frequencyBinCount);
      masterAnalyser.getByteFrequencyData(masterDataArray);
      const masterAverage = masterDataArray.reduce((sum, value) => sum + value, 0) / masterDataArray.length;
      
      setVuLevels(newVuLevels);
      setMasterVuLevel((masterAverage / 255) * 100);
    }, 50);
  };

  // Update channel volume
  const updateChannelVolume = (channelId: string, volume: number) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel?.gainNode && audioContext) {
      channel.gainNode.gain.setTargetAtTime(volume / 100, audioContext.currentTime, 0.01);
      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, volume } : c
      ));
    }
  };

  // Toggle channel mute
  const toggleChannelMute = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel?.gainNode && audioContext) {
      const newMuteState = !channel.isMuted;
      const targetGain = newMuteState ? 0 : channel.volume / 100;
      channel.gainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.01);
      
      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, isMuted: newMuteState } : c
      ));
    }
  };

  // Update master volume
  const updateMasterVolume = (volume: number) => {
    if (masterGainNode && audioContext) {
      masterGainNode.gain.setTargetAtTime(volume / 100, audioContext.currentTime, 0.01);
      setMasterSection(prev => ({ ...prev, volume }));
    }
  };

  // Toggle master mute
  const toggleMasterMute = () => {
    if (masterGainNode && audioContext) {
      const newMuteState = !masterSection.isMuted;
      const targetGain = newMuteState ? 0 : masterSection.volume / 100;
      masterGainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.01);
      
      setMasterSection(prev => ({ ...prev, isMuted: newMuteState }));
    }
  };

  // Add audio source to channel
  const addAudioSourceToChannel = async (channelId: string, sourceType: 'microphone' | 'file') => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel || !audioContext) return;

    try {
      let source: AudioNode;

      if (sourceType === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          }
        });
        source = audioContext.createMediaStreamSource(stream);
      } else {
        // For file input, this would be connected when audio element is created
        return;
      }

      // Connect source to channel processing chain
      if (channel.gainNode) {
        source.connect(channel.gainNode);
        setChannels(prev => prev.map(c => 
          c.id === channelId ? { ...c, source, isActive: true } : c
        ));

        toast({
          title: 'Audio Source Connected',
          description: `${sourceType} connected to ${channel.name}`,
        });
      }

    } catch (error) {
      console.error('Failed to add audio source:', error);
      toast({
        title: 'Audio Source Failed',
        description: `Could not connect ${sourceType} to ${channel.name}`,
        variant: 'destructive'
      });
    }
  };

  // Get VU meter color based on level
  const getVUColor = (level: number) => {
    if (level > 85) return 'bg-red-500';
    if (level > 70) return 'bg-yellow-500';
    if (level > 50) return 'bg-green-500';
    return 'bg-green-400';
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
      {/* Mixer Header */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Professional Audio Mixer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={audioContext ? "default" : "secondary"}>
                {audioContext ? 'READY' : 'OFFLINE'}
              </Badge>
              {!audioContext && (
                <Button onClick={initializeMixer} size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Mixer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {audioContext && (
        <>
          {/* Channel Strips */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {channels.map((channel) => (
              <Card key={channel.id} className="glass-panel border-border/50">
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <h4 className="text-sm font-medium truncate">{channel.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {channel.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Channel Controls */}
                  <div className="flex justify-center gap-1">
                    <Button
                      size="sm"
                      variant={channel.isActive ? "default" : "outline"}
                      onClick={() => addAudioSourceToChannel(channel.id, channel.type === 'microphone' ? 'microphone' : 'file')}
                      className="h-8 w-8 p-0"
                    >
                      {channel.type === 'microphone' ? (
                        channel.isActive ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />
                      ) : (
                        channel.isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={channel.isMuted ? "destructive" : "outline"}
                      onClick={() => toggleChannelMute(channel.id)}
                      className="h-8 w-8 p-0"
                    >
                      {channel.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  </div>

                  {/* VU Meter */}
                  <div className="h-32 w-6 mx-auto bg-gray-200 rounded-full relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 w-full transition-all duration-100 ${getVUColor(vuLevels[channel.id] || 0)}`}
                      style={{ height: `${Math.min(vuLevels[channel.id] || 0, 100)}%` }}
                    />
                    {/* VU meter markings */}
                    <div className="absolute inset-0 flex flex-col justify-between py-1">
                      {[100, 85, 70, 50, 30, 10].map(mark => (
                        <div key={mark} className="w-full h-px bg-gray-400" />
                      ))}
                    </div>
                  </div>

                  {/* Volume Fader */}
                  <div className="h-24 flex items-center justify-center">
                    <Slider
                      value={[channel.volume]}
                      onValueChange={([value]) => updateChannelVolume(channel.id, value)}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-20"
                    />
                  </div>

                  {/* Volume Display */}
                  <div className="text-center text-xs font-mono">
                    {channel.volume}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Master Section */}
          <Card className="glass-panel border-border/50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Activity className="h-5 w-5" />
                Master Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                {/* Master VU Meter */}
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-sm font-medium">Master Level</Label>
                  <div className="h-48 w-8 bg-gray-200 rounded-full relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 w-full transition-all duration-100 ${getVUColor(masterVuLevel)}`}
                      style={{ height: `${Math.min(masterVuLevel, 100)}%` }}
                    />
                    {/* Peak indicators */}
                    <div className="absolute top-1 left-0 right-0 h-2 bg-red-500 opacity-0" />
                  </div>
                  <div className="text-xs font-mono">{Math.round(masterVuLevel)}%</div>
                </div>

                {/* Master Controls */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={masterSection.isMuted ? "destructive" : "outline"}
                      onClick={toggleMasterMute}
                    >
                      {masterSection.isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                      {masterSection.isMuted ? 'MUTED' : 'LIVE'}
                    </Button>
                  </div>

                  {/* Master Volume */}
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-sm font-medium">Master Volume</Label>
                    <div className="h-32 flex items-center">
                      <Slider
                        value={[masterSection.volume]}
                        onValueChange={([value]) => updateMasterVolume(value)}
                        max={100}
                        step={1}
                        orientation="vertical"
                        className="h-28"
                      />
                    </div>
                    <div className="text-sm font-mono">{masterSection.volume}%</div>
                  </div>
                </div>

                {/* Master Processing */}
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">Master Processing</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={masterSection.limiter.enabled}
                        onCheckedChange={(enabled) => 
                          setMasterSection(prev => ({ 
                            ...prev, 
                            limiter: { ...prev.limiter, enabled } 
                          }))
                        }
                      />
                      <Label className="text-xs">Limiter</Label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Threshold: {masterSection.limiter.threshold}dB
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProfessionalAudioMixer;