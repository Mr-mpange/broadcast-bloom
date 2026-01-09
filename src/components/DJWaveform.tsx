import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AudioTrack } from './DJMixer';

interface CuePoint {
  id: string;
  time: number;
  label: string;
  color: string;
}

interface DJWaveformProps {
  track: AudioTrack;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  cuePoints: CuePoint[];
}

const DJWaveform: React.FC<DJWaveformProps> = ({
  track,
  currentTime,
  duration,
  onSeek,
  cuePoints
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate waveform data from audio file
  useEffect(() => {
    if (!track.file) return;

    const analyzeAudio = async () => {
      setIsAnalyzing(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await track.file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extract waveform data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 1000; // Number of waveform points
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          waveform.push(sum / blockSize);
        }
        
        setWaveformData(waveform);
      } catch (error) {
        console.error('Failed to analyze audio:', error);
        // Generate dummy waveform data as fallback
        const dummyWaveform = Array.from({ length: 1000 }, () => Math.random() * 0.8);
        setWaveformData(dummyWaveform);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeAudio();
  }, [track.file]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const progress = duration > 0 ? currentTime / duration : 0;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveformData.length;
    const centerY = height / 2;

    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * (height * 0.8);
      
      // Color based on playback progress
      const isPlayed = (index / waveformData.length) < progress;
      ctx.fillStyle = isPlayed ? '#3b82f6' : '#64748b';
      
      // Draw waveform bar
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    });

    // Draw current position indicator
    const currentX = progress * width;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();

    // Draw cue points
    cuePoints.forEach((cue) => {
      const cueProgress = duration > 0 ? cue.time / duration : 0;
      const cueX = cueProgress * width;
      
      // Draw cue point marker
      ctx.fillStyle = cue.color;
      ctx.beginPath();
      ctx.arc(cueX, height - 10, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw cue point line
      ctx.strokeStyle = cue.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cueX, 0);
      ctx.lineTo(cueX, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);
    });

  }, [waveformData, currentTime, duration, cuePoints]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 80; // Fixed height
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Handle click to seek
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(seekTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-3 bg-muted/30 border border-border">
      <div className="space-y-2">
        {/* Waveform Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Waveform</span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        {/* Waveform Canvas */}
        <div ref={containerRef} className="relative">
          {isAnalyzing ? (
            <div className="h-20 flex items-center justify-center bg-muted/50 rounded border border-border">
              <div className="text-sm text-muted-foreground">Analyzing audio...</div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-20 cursor-pointer rounded border border-border bg-background/50"
              style={{ display: 'block' }}
            />
          )}
          
          {/* Cue Point Labels */}
          {cuePoints.length > 0 && duration > 0 && (
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
              {cuePoints.map((cue) => {
                const cueProgress = cue.time / duration;
                const cueX = cueProgress * 100;
                
                return (
                  <div
                    key={cue.id}
                    className="absolute top-0 text-xs font-medium px-1 py-0.5 rounded text-white shadow-sm"
                    style={{
                      left: `${cueX}%`,
                      backgroundColor: cue.color,
                      transform: 'translateX(-50%)',
                      fontSize: '10px'
                    }}
                  >
                    {cue.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Markers */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          {duration > 60 && (
            <>
              <span>{formatTime(duration * 0.25)}</span>
              <span>{formatTime(duration * 0.5)}</span>
              <span>{formatTime(duration * 0.75)}</span>
            </>
          )}
          <span>{formatTime(duration)}</span>
        </div>

        {/* Waveform Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Click to seek • Cue points shown as colored markers</span>
          <span>{waveformData.length} samples</span>
        </div>
      </div>
    </Card>
  );
};

export default DJWaveform;