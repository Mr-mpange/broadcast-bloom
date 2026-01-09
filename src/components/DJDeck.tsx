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
  Upload,
  RotateCcw,
  FastForward,
  Rewind
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DeckState, AudioTrack } from './DJMixer';

interface DJDeckProps {
  deckId: string;
  state: DeckState;
  onUpdate: (updates: Partial<DeckState>) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  crossfaderPosition: number;
  syncEnabled: boolean;
}

const DJDeck = ({ deckId, state, onUpdate, audioRef, crossfaderPosition, syncEnabled }: DJDeckProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate waveform data from audio
  const generateWaveform = useCallback(async (audioFile: File) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 1000;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      setWaveformData(waveform);
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please select an audio file (MP3, WAV, OGG, M4A, FLAC).",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      
      audio.addEventListener('loadedmetadata', () => {
        const track: AudioTrack = {
          id: Date.now().toString(),
          name: file.name,
          file,
          url,
          duration: audio.duration,
          bpm: 120, // Default BPM, would be detected in real implementation
        };

        onUpdate({ 
          track,
          duration: audio.duration,
          currentTime: 0,
          isPlaying: false
        });

        if (audioRef.current) {
          audioRef.current.src = url;
        }

        generateWaveform(file);

        toast({
          title: "Track Loaded",
          description: `${file.name} loaded to Deck ${deckId}`,
        });
      });

      audio.addEventListener('error', () => {
        toast({
          title: "Load Error",
          description: "Failed to load audio file.",
          variant: "destructive",
        });
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process audio file.",
        variant: "destructive",
      });
    }
  }, [deckId, onUpdate, audioRef, generateWaveform, toast]);

  // Playback controls
  const handlePlay = useCallback(() => {
    if (!audioRef.current || !state.track) return;

    if (state.isPlaying) {
      audioRef.current.pause();
      onUpdate({ isPlaying: false });
    } else {
      audioRef.current.play();
      onUpdate({ isPlaying: true });
    }
  }, [audioRef, state.isPlaying, state.track, onUpdate]);

  const handleStop = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    onUpdate({ isPlaying: false, currentTime: 0 });
  }, [audioRef, onUpdate]);

  const handleCue = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    onUpdate({ currentTime: 0 });
  }, [audioRef, onUpdate]);

  // Update audio element when state changes
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    // Volume control
    audio.volume = state.isMuted ? 0 : state.volume * state.gain;
    
    // Pitch/tempo control (simplified)
    if (audio.playbackRate !== state.tempo) {
      audio.playbackRate = state.tempo;
    }

    // Time update listener
    const handleTimeUpdate = () => {
      onUpdate({ currentTime: audio.currentTime });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioRef, state.volume, state.isMuted, state.gain, state.tempo, onUpdate]);

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Deck {deckId}</span>
          <div className="flex items-center gap-2">
            {state.track && (
              <Badge variant="secondary" className="text-xs">
                {state.track.bpm} BPM
              </Badge>
            )}
            {syncEnabled && (
              <Badge variant="default" className="text-xs">
                SYNC
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Track Info */}
        <div className="space-y-2">
          {state.track ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="font-medium text-sm truncate">{state.track.name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.floor(state.currentTime / 60)}:{(state.currentTime % 60).toFixed(0).padStart(2, '0')} / 
                {Math.floor(state.duration / 60)}:{(state.duration % 60).toFixed(0).padStart(2, '0')}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border-2 border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">No track loaded</p>
            </div>
          )}
        </div>

        {/* Waveform Display */}
        {waveformData.length > 0 && (
          <div className="h-16 bg-muted/30 rounded-lg p-2 relative overflow-hidden">
            <div className="flex items-end h-full gap-px">
              {waveformData.map((amplitude, index) => (
                <div
                  key={index}
                  className="bg-primary/60 flex-1 min-w-px"
                  style={{ 
                    height: `${Math.max(2, amplitude * 100)}%`,
                    opacity: index / waveformData.length < (state.currentTime / state.duration) ? 1 : 0.3
                  }}
                />
              ))}
            </div>
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-accent"
              style={{ left: `${(state.currentTime / state.duration) * 100}%` }}
            />
          </div>
        )}

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCue}
            disabled={!state.track}
          >
            <RotateCcw size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePlay}
            disabled={!state.track}
          >
            {state.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStop}
            disabled={!state.track}
          >
            <Square size={16} />
          </Button>
        </div>

        {/* Volume and Gain */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpdate({ isMuted: !state.isMuted })}
              >
                {state.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
            </div>
            <Slider
              value={[state.isMuted ? 0 : state.volume * 100]}
              onValueChange={([value]) => onUpdate({ volume: value / 100 })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gain</label>
            <Slider
              value={[state.gain * 100]}
              onValueChange={([value]) => onUpdate({ gain: value / 100 })}
              max={150}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pitch ({state.pitch > 0 ? '+' : ''}{state.pitch.toFixed(1)}%)</label>
            <Slider
              value={[state.pitch]}
              onValueChange={([value]) => onUpdate({ 
                pitch: value,
                tempo: 1 + (value / 100)
              })}
              min={-50}
              max={50}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Load Track Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full gap-2"
        >
          <Upload size={16} />
          Load Track
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default DJDeck;