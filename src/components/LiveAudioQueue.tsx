import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Play, 
  Pause, 
  Square, 
  Upload,
  Trash2,
  Clock,
  Zap,
  Music,
  Volume2,
  SkipForward,
  RotateCcw,
  Save,
  Database
} from 'lucide-react';

interface QueuedTrack {
  id: string;
  name: string;
  fileName: string;
  fileData: string; // Base64 encoded file data
  fileType: string;
  fileSize: number;
  url: string;
  duration: number;
  uploadedAt: string; // ISO string for JSON serialization
  isPlaying: boolean;
  isSaved: boolean; // Track if it's been saved to database
}

const LiveAudioQueue = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [queuedTracks, setQueuedTracks] = useState<QueuedTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<QueuedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState<string | null>(null);
  const [saveMetadata, setSaveMetadata] = useState({
    genre: '',
    artist: ''
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load persisted tracks from localStorage on mount
  useEffect(() => {
    const loadPersistedTracks = () => {
      try {
        // Try new format first
        const saved = localStorage.getItem('pulse_fm_live_queue_metadata');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Show metadata but indicate files need to be re-uploaded
          const placeholderTracks = parsed.map((track: any) => ({
            ...track,
            fileData: '', // No file data
            url: '', // No URL
            isPlaying: false, // Reset playing state
          }));
          setQueuedTracks(placeholderTracks);
          
          if (placeholderTracks.length > 0) {
            toast({
              title: 'Queue Restored',
              description: `Found ${placeholderTracks.length} tracks from previous session. Re-upload files to play them.`,
              variant: 'default'
            });
          }
        }
      } catch (error) {
        console.error('Error loading persisted tracks:', error);
        localStorage.removeItem('pulse_fm_live_queue_metadata');
        localStorage.removeItem('pulse_fm_live_queue');
      }
    };

    loadPersistedTracks();
  }, [toast]);

  // Save tracks to localStorage whenever queuedTracks changes
  useEffect(() => {
    if (queuedTracks.length > 0) {
      try {
        // Only save essential metadata, not the file data
        const tracksToSave = queuedTracks.map(track => ({
          id: track.id,
          name: track.name,
          fileName: track.fileName,
          fileType: track.fileType,
          fileSize: track.fileSize,
          duration: track.duration,
          uploadedAt: track.uploadedAt,
          isPlaying: track.isPlaying,
          isSaved: track.isSaved,
          // Don't save fileData and url - they'll be recreated on upload
        }));
        localStorage.setItem('pulse_fm_live_queue_metadata', JSON.stringify(tracksToSave));
      } catch (error) {
        console.error('Error saving tracks metadata to localStorage:', error);
        // If storage is full, clear old data and try again
        try {
          localStorage.removeItem('pulse_fm_live_queue_metadata');
          localStorage.removeItem('pulse_fm_live_queue'); // Remove old format
          const tracksToSave = queuedTracks.slice(0, 5).map(track => ({ // Limit to 5 most recent
            id: track.id,
            name: track.name,
            fileName: track.fileName,
            fileType: track.fileType,
            fileSize: track.fileSize,
            duration: track.duration,
            uploadedAt: track.uploadedAt,
            isPlaying: track.isPlaying,
            isSaved: track.isSaved,
          }));
          localStorage.setItem('pulse_fm_live_queue_metadata', JSON.stringify(tracksToSave));
        } catch (retryError) {
          toast({
            title: 'Storage Warning',
            description: 'Unable to save queue to browser storage. Files will be lost on page refresh.',
            variant: 'destructive'
          });
        }
      }
    } else {
      localStorage.removeItem('pulse_fm_live_queue_metadata');
      localStorage.removeItem('pulse_fm_live_queue'); // Clean up old format
    }
  }, [queuedTracks, toast]);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
    });
  };

  // Helper function to create blob URL from base64
  const createBlobUrlFromBase64 = (base64Data: string, fileType: string): string => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return '';
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };
    const handleError = () => {
      setIsPlaying(false);
      toast({
        title: 'Playback Error',
        description: 'There was an error playing this audio file.',
        variant: 'destructive'
      });
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('canplay', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('canplay', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/x-m4a'];
      return validTypes.some(type => file.type === type) || file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i);
    });

    if (validFiles.length === 0) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload MP3, WAV, OGG, M4A, or FLAC files only.',
        variant: 'destructive'
      });
      return;
    }

    for (const file of validFiles) {
      try {
        const url = URL.createObjectURL(file);
        
        // Get audio duration
        let duration = 0;
        try {
          duration = await getAudioDuration(file);
        } catch (error) {
          console.warn('Could not get audio duration:', error);
        }
        
        const track: QueuedTrack = {
          id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileData: '', // Don't store file data to avoid quota issues
          fileType: file.type,
          fileSize: file.size,
          url,
          duration,
          uploadedAt: new Date().toISOString(),
          isPlaying: false,
          isSaved: false,
        };
        
        setQueuedTracks(prev => [...prev, track]);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        toast({
          title: 'File Processing Error',
          description: `Failed to process ${file.name}`,
          variant: 'destructive'
        });
      }
    }

    toast({
      title: 'Files queued for live play!',
      description: `Added ${validFiles.length} file(s) to your live queue. Note: Files will need to be re-uploaded after page refresh.`,
    });
  };

  // Helper function to get audio duration
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = reject;
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    await processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const playTrack = async (track: QueuedTrack) => {
    if (!track.url) {
      toast({
        title: 'File Not Available',
        description: 'Please re-upload this file to play it.',
        variant: 'destructive'
      });
      return;
    }

    if (audioRef.current) {
      try {
        // Stop current track
        if (currentTrack) {
          setQueuedTracks(prev => prev.map(t => 
            t.id === currentTrack.id ? { ...t, isPlaying: false } : t
          ));
        }

        audioRef.current.src = track.url;
        setCurrentTrack(track);
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);

        // Update track status
        setQueuedTracks(prev => prev.map(t => 
          t.id === track.id ? { ...t, isPlaying: true } : { ...t, isPlaying: false }
        ));

        toast({
          title: 'Now Playing Live',
          description: `${track.name} is now broadcasting`,
        });
      } catch (error) {
        console.error('Error playing track:', error);
        toast({
          title: 'Playback Error',
          description: 'Unable to play this audio file.',
          variant: 'destructive'
        });
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (currentTrack) {
        setQueuedTracks(prev => prev.map(t => 
          t.id === currentTrack.id ? { ...t, isPlaying: false } : t
        ));
      }
    }
  };

  const playNext = () => {
    if (!currentTrack || queuedTracks.length === 0) return;
    
    const currentIndex = queuedTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queuedTracks.length;
    playTrack(queuedTracks[nextIndex]);
  };

  const removeTrack = (trackId: string) => {
    const track = queuedTracks.find(t => t.id === trackId);
    if (track) {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(track.url);
    }

    setQueuedTracks(prev => prev.filter(t => t.id !== trackId));
    
    if (currentTrack?.id === trackId) {
      stopPlayback();
      setCurrentTrack(null);
    }

    toast({
      title: 'Track Removed',
      description: 'Track removed from live queue',
    });
  };

  const clearQueue = () => {
    // Revoke all object URLs
    queuedTracks.forEach(track => {
      URL.revokeObjectURL(track.url);
    });

    setQueuedTracks([]);
    stopPlayback();
    setCurrentTrack(null);

    toast({
      title: 'Queue Cleared',
      description: 'All tracks removed from live queue',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Save track to database permanently
  const saveTrackToDatabase = async (trackId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save tracks to the library.',
        variant: 'destructive'
      });
      return;
    }

    const track = queuedTracks.find(t => t.id === trackId);
    if (!track || !track.url) {
      toast({
        title: 'File Not Available',
        description: 'Please re-upload the file to save it to the library.',
        variant: 'destructive'
      });
      return;
    }

    // Validate required fields
    if (!saveMetadata.artist.trim() || !saveMetadata.genre.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in both Artist and Genre fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Show loading state
      toast({
        title: 'Saving Track...',
        description: 'Uploading file and saving to your audio library.',
      });

      // Get the file blob from the URL
      const response = await fetch(track.url);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileExt = track.fileName.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `user-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

      // Save to audio_content table (using type assertion for now)
      const { error: dbError } = await (supabase as any)
        .from('audio_content')
        .insert({
          name: track.name,
          artist: saveMetadata.artist.trim(),
          file_path: filePath,
          file_size: track.fileSize,
          duration: Math.round(track.duration),
          content_type: 'music', // Default to music for user uploads
          genre: saveMetadata.genre.trim(),
          category: 'user-upload',
          language: 'en',
          explicit_content: false,
          is_active: true,
          play_count: 0,
          upload_date: new Date().toISOString(),
          uploaded_by: user.id
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save track information to database');
      }

      // Mark track as saved
      setQueuedTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, isSaved: true } : t
      ));

      // Close dialog and reset form
      setShowSaveDialog(null);
      setSaveMetadata({
        genre: '',
        artist: ''
      });

      toast({
        title: 'Track Saved Successfully! 🎵',
        description: `"${track.name}" by ${saveMetadata.artist} has been added to your audio library.`,
      });

    } catch (error: any) {
      console.error('Error saving track:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save track to library. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="glass-panel border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Live Audio Queue</h2>
              <p className="text-purple-100 text-sm">Quick upload for instant broadcast</p>
            </div>
          </CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Clock className="h-3 w-3 mr-1" />
            {queuedTracks.length} queued
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Upload Area */}
        <div 
          className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border/50 hover:border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-2">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <div>
              <Label htmlFor="queue-upload" className="cursor-pointer">
                <span className="font-medium">Quick Upload for Live Play</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to upload audio files for immediate broadcast
              </p>
            </div>
            <Input
              id="queue-upload"
              type="file"
              ref={fileInputRef}
              multiple
              accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/flac,.mp3,.wav,.ogg,.m4a,.flac"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload size={16} />
              Browse Files
            </Button>
          </div>
        </div>

        {/* Current Playing */}
        {currentTrack && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    {currentTrack.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={togglePlay}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={stopPlayback}>
                    <Square size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={playNext}>
                    <SkipForward size={16} />
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div 
                className="w-full bg-muted rounded-full h-2 cursor-pointer"
                onClick={(e) => {
                  if (audioRef.current && duration) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
              >
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        {queuedTracks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Live Queue ({queuedTracks.length})</h4>
              <Button onClick={clearQueue} variant="outline" size="sm" className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queuedTracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    track.isPlaying
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-muted/20 hover:bg-muted/40'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {track.isPlaying ? (
                        <Volume2 size={16} className="text-primary" />
                      ) : (
                        <Music size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate flex items-center gap-2">
                        {track.name}
                        {!track.url && (
                          <Badge variant="outline" className="text-xs">
                            Re-upload needed
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {getTimeAgo(track.uploadedAt)} • {(track.fileSize / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {track.isPlaying && (
                      <Badge variant="default" className="text-xs">
                        LIVE
                      </Badge>
                    )}
                    {track.isSaved && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        <Database className="h-2 w-2 mr-1" />
                        Saved ✓
                      </Badge>
                    )}
                    {!track.isSaved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSaveDialog(track.id);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Save to permanent library"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrack(track.id);
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {queuedTracks.length === 0 && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              No files in live queue. Upload audio files for instant broadcast - they'll persist until manually removed.
            </AlertDescription>
          </Alert>
        )}

        {/* Modern Save to Audio Library Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Save className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Save to Library</h2>
                    <p className="text-emerald-100 text-sm">Add this track to your permanent collection</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSaveDialog(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Track Preview */}
                {(() => {
                  const track = queuedTracks.find(t => t.id === showSaveDialog);
                  return track ? (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Music className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">♪</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">{track.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                              </svg>
                              {(track.fileSize / 1024 / 1024).toFixed(1)}MB
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Form Fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Artist Name
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saveMetadata.artist}
                      onChange={(e) => setSaveMetadata(prev => ({ ...prev, artist: e.target.value }))}
                      placeholder="Enter the artist or band name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          document.getElementById('genre-input')?.focus();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2C7 1.45 7.45 1 8 1h8c.55 0 1 .45 1 1v2m-9 0h10m-10 0C5.9 4 5 4.9 5 6v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2" />
                      </svg>
                      Music Genre
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="genre-input"
                      type="text"
                      value={saveMetadata.genre}
                      onChange={(e) => setSaveMetadata(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder="e.g., Pop, Hip Hop, Jazz, Rock, Electronic"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && saveMetadata.artist.trim() && saveMetadata.genre.trim()) {
                          saveTrackToDatabase(showSaveDialog);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">What happens next?</h4>
                      <p className="text-sm text-blue-700">
                        Your track will be uploaded to secure cloud storage and added to your Audio Content Manager. 
                        You can then use it in future broadcasts and playlists.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => saveTrackToDatabase(showSaveDialog)}
                    disabled={!saveMetadata.artist.trim() || !saveMetadata.genre.trim()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Database className="h-5 w-5" />
                    Save to Library
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(null);
                      setSaveMetadata({ genre: '', artist: '' });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
};

export default LiveAudioQueue;