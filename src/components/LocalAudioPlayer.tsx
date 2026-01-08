import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Upload,
  Music,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
}

const LocalAudioPlayer = () => {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const track: AudioTrack = {
          id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          file,
          url,
          duration: 0,
        };
        
        setTracks(prev => [...prev, track]);
        
        // If no current track, set this as current
        if (!currentTrack) {
          setCurrentTrack(track);
        }
      }
    });

    toast({
      title: 'Audio files added!',
      description: `Added ${files.length} audio file(s) to your playlist.`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const playTrack = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      setCurrentTrack(track);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    playTrack(tracks[prevIndex]);
  };

  const removeTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    
    if (currentTrack?.id === trackId) {
      stopPlayback();
      setCurrentTrack(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Music className="h-5 w-5 text-primary" />
          Local Audio Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="audio-upload">Upload Audio Files</Label>
          <div className="flex gap-2">
            <Input
              id="audio-upload"
              type="file"
              ref={fileInputRef}
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload size={16} />
              Browse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: MP3, WAV, OGG, M4A, FLAC
          </p>
        </div>

        {/* Current Track Display */}
        {currentTrack && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-foreground">{currentTrack.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={playPrevious}>
                  <SkipBack size={16} />
                </Button>
                <Button size="sm" onClick={togglePlay}>
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={stopPlayback}>
                  <Square size={16} />
                </Button>
                <Button size="sm" variant="ghost" onClick={playNext}>
                  <SkipForward size={16} />
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : Math.round(volume * 100)}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Playlist */}
        {tracks.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Playlist ({tracks.length} tracks)</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    currentTrack?.id === track.id 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-muted/20 hover:bg-muted/40'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Music size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{track.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No audio files loaded</p>
            <p className="text-sm">Upload audio files to start playing</p>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
};

export default LocalAudioPlayer;