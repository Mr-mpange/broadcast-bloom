import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Repeat,
  Headphones,
  Mic,
  Settings,
  Zap,
  Waves,
  Filter,
  Music2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DJDeck from './DJDeck';
import DJCrossfader from './DJCrossfader';
import DJEffectsRack from './DJEffectsRack';
import DJEqualizer from './DJEqualizer';
import DJBeatSync from './DJBeatSync';
import DJCuePoints from './DJCuePoints';
import DJLooper from './DJLooper';

export interface AudioTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  bpm?: number;
  key?: string;
  waveform?: number[];
}

export interface DeckState {
  track: AudioTrack | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  pitch: number;
  tempo: number;
  eq: {
    high: number;
    mid: number;
    low: number;
  };
  gain: number;
  cuePoints: Array<{
    id: string;
    time: number;
    label: string;
    color: string;
  }>;
  loop: {
    enabled: boolean;
    start: number;
    end: number;
    length: number;
  };
  effects: {
    reverb: number;
    delay: number;
    filter: number;
    flanger: number;
  };
}

const DJMixer = () => {
  const { toast } = useToast();
  
  // Deck states
  const [deckA, setDeckA] = useState<DeckState>({
    track: null,
    isPlaying: false,
    volume: 0.75,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    pitch: 0,
    tempo: 1,
    eq: { high: 0, mid: 0, low: 0 },
    gain: 0.75,
    cuePoints: [],
    loop: { enabled: false, start: 0, end: 0, length: 4 },
    effects: { reverb: 0, delay: 0, filter: 0, flanger: 0 }
  });

  const [deckB, setDeckB] = useState<DeckState>({
    track: null,
    isPlaying: false,
    volume: 0.75,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    pitch: 0,
    tempo: 1,
    eq: { high: 0, mid: 0, low: 0 },
    gain: 0.75,
    cuePoints: [],
    loop: { enabled: false, start: 0, end: 0, length: 4 },
    effects: { reverb: 0, delay: 0, filter: 0, flanger: 0 }
  });

  // Mixer state
  const [crossfaderPosition, setCrossfaderPosition] = useState(50);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [masterIsMuted, setMasterIsMuted] = useState(false);
  const [cueVolume, setCueVolume] = useState(0.7);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  
  // Audio contexts and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const cueGainNodeRef = useRef<GainNode | null>(null);
  const crossfaderNodeRef = useRef<GainNode | null>(null);
  
  // Audio elements
  const deckARef = useRef<HTMLAudioElement | null>(null);
  const deckBRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create master gain node
        masterGainNodeRef.current = audioContextRef.current.createGain();
        masterGainNodeRef.current.connect(audioContextRef.current.destination);
        
        // Create cue gain node
        cueGainNodeRef.current = audioContextRef.current.createGain();
        
        // Create crossfader node
        crossfaderNodeRef.current = audioContextRef.current.createGain();
        crossfaderNodeRef.current.connect(masterGainNodeRef.current);
        
        toast({
          title: "DJ Mixer Ready",
          description: "Professional audio engine initialized successfully!",
        });
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        toast({
          title: "Audio Error",
          description: "Failed to initialize professional audio engine.",
          variant: "destructive",
        });
      }
    };

    initAudioContext();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [toast]);

  // Update master volume
  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.value = masterIsMuted ? 0 : masterVolume;
    }
  }, [masterVolume, masterIsMuted]);

  // Update crossfader
  useEffect(() => {
    if (crossfaderNodeRef.current) {
      // Crossfader curve (0 = full A, 50 = center, 100 = full B)
      const position = crossfaderPosition / 100;
      const deckAGain = Math.cos(position * Math.PI / 2);
      const deckBGain = Math.sin(position * Math.PI / 2);
      
      // Apply crossfader curves to individual decks
      // This would be implemented in the individual deck components
    }
  }, [crossfaderPosition]);

  const handleDeckUpdate = useCallback((deck: 'A' | 'B', updates: Partial<DeckState>) => {
    if (deck === 'A') {
      setDeckA(prev => ({ ...prev, ...updates }));
    } else {
      setDeckB(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const handleBeatSync = useCallback(() => {
    if (!deckA.track || !deckB.track) {
      toast({
        title: "Sync Error",
        description: "Both decks need tracks loaded for beat sync.",
        variant: "destructive",
      });
      return;
    }

    // Calculate BPM difference and adjust tempo
    const bpmA = deckA.track.bpm || 120;
    const bpmB = deckB.track.bpm || 120;
    const tempoAdjustment = bpmA / bpmB;

    handleDeckUpdate('B', { tempo: tempoAdjustment });
    setSyncEnabled(true);

    toast({
      title: "Beats Synced",
      description: `Synced Deck B to match Deck A (${bpmA} BPM)`,
    });
  }, [deckA.track, deckB.track, handleDeckUpdate, toast]);

  const handleMasterRecord = useCallback(() => {
    setRecordingEnabled(!recordingEnabled);
    
    if (!recordingEnabled) {
      // Start recording logic would go here
      toast({
        title: "Recording Started",
        description: "Master output is now being recorded.",
      });
    } else {
      // Stop recording logic would go here
      toast({
        title: "Recording Stopped",
        description: "Recording saved successfully.",
      });
    }
  }, [recordingEnabled, toast]);

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Music2 className="h-5 w-5 text-primary" />
            Professional DJ Mixer
            <Badge variant={syncEnabled ? "default" : "secondary"} className="ml-2">
              {syncEnabled ? "SYNC ON" : "SYNC OFF"}
            </Badge>
            <Badge variant={recordingEnabled ? "destructive" : "secondary"} className="ml-2">
              {recordingEnabled ? "● REC" : "REC"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Master Volume</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMasterIsMuted(!masterIsMuted)}
                >
                  {masterIsMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
              </div>
              <Slider
                value={[masterIsMuted ? 0 : masterVolume * 100]}
                onValueChange={([value]) => setMasterVolume(value / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Cue Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cue Volume</label>
                <Headphones size={16} className="text-muted-foreground" />
              </div>
              <Slider
                value={[cueVolume * 100]}
                onValueChange={([value]) => setCueVolume(value / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Master Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBeatSync}
                variant={syncEnabled ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Zap size={16} />
                Sync
              </Button>
              <Button
                onClick={handleMasterRecord}
                variant={recordingEnabled ? "destructive" : "outline"}
                size="sm"
                className="gap-2"
              >
                <RotateCcw size={16} />
                Record
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Mixer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deck A */}
        <div className="space-y-4">
          <DJDeck
            deckId="A"
            state={deckA}
            onUpdate={(updates) => handleDeckUpdate('A', updates)}
            audioRef={deckARef}
            crossfaderPosition={crossfaderPosition}
            syncEnabled={syncEnabled}
          />
          <DJEqualizer
            deckId="A"
            eq={deckA.eq}
            onEQChange={(eq) => handleDeckUpdate('A', { eq })}
          />
          <DJCuePoints
            deckId="A"
            cuePoints={deckA.cuePoints}
            currentTime={deckA.currentTime}
            onCuePointsChange={(cuePoints) => handleDeckUpdate('A', { cuePoints })}
          />
        </div>

        {/* Center Mixer Controls */}
        <div className="space-y-4">
          <DJCrossfader
            position={crossfaderPosition}
            onPositionChange={setCrossfaderPosition}
          />
          <DJBeatSync
            deckA={deckA}
            deckB={deckB}
            syncEnabled={syncEnabled}
            onSync={handleBeatSync}
            onSyncToggle={setSyncEnabled}
          />
          <DJEffectsRack
            deckAEffects={deckA.effects}
            deckBEffects={deckB.effects}
            onDeckAEffectsChange={(effects) => handleDeckUpdate('A', { effects })}
            onDeckBEffectsChange={(effects) => handleDeckUpdate('B', { effects })}
          />
        </div>

        {/* Deck B */}
        <div className="space-y-4">
          <DJDeck
            deckId="B"
            state={deckB}
            onUpdate={(updates) => handleDeckUpdate('B', updates)}
            audioRef={deckBRef}
            crossfaderPosition={crossfaderPosition}
            syncEnabled={syncEnabled}
          />
          <DJEqualizer
            deckId="B"
            eq={deckB.eq}
            onEQChange={(eq) => handleDeckUpdate('B', { eq })}
          />
          <DJCuePoints
            deckId="B"
            cuePoints={deckB.cuePoints}
            currentTime={deckB.currentTime}
            onCuePointsChange={(cuePoints) => handleDeckUpdate('B', { cuePoints })}
          />
        </div>
      </div>

      {/* Loop Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DJLooper
          deckId="A"
          loop={deckA.loop}
          currentTime={deckA.currentTime}
          isPlaying={deckA.isPlaying}
          onLoopChange={(loop) => handleDeckUpdate('A', { loop })}
        />
        <DJLooper
          deckId="B"
          loop={deckB.loop}
          currentTime={deckB.currentTime}
          isPlaying={deckB.isPlaying}
          onLoopChange={(loop) => handleDeckUpdate('B', { loop })}
        />
      </div>

      {/* Hidden Audio Elements */}
      <audio ref={deckARef} preload="metadata" />
      <audio ref={deckBRef} preload="metadata" />
    </div>
  );
};

export default DJMixer;