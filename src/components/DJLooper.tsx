import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Repeat, 
  Play, 
  Square, 
  RotateCcw,
  Timer,
  Target
} from 'lucide-react';

interface LoopSettings {
  enabled: boolean;
  start: number;
  end: number;
  length: number;
}

interface DJLooperProps {
  deckId: string;
  loop: LoopSettings;
  currentTime: number;
  isPlaying: boolean;
  onLoopChange: (loop: LoopSettings) => void;
}

const DJLooper = ({ deckId, loop, currentTime, isPlaying, onLoopChange }: DJLooperProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const setLoopStart = () => {
    onLoopChange({
      ...loop,
      start: currentTime,
      end: Math.max(loop.end, currentTime + loop.length)
    });
  };

  const setLoopEnd = () => {
    onLoopChange({
      ...loop,
      end: currentTime,
      start: Math.min(loop.start, currentTime - loop.length)
    });
  };

  const enableLoop = () => {
    if (!loop.enabled) {
      // Auto-set loop points if not set
      if (loop.start === 0 && loop.end === 0) {
        onLoopChange({
          ...loop,
          enabled: true,
          start: Math.max(0, currentTime - loop.length / 2),
          end: currentTime + loop.length / 2
        });
      } else {
        onLoopChange({ ...loop, enabled: true });
      }
    } else {
      onLoopChange({ ...loop, enabled: false });
    }
  };

  const setAutoBeatLoop = (beats: number) => {
    // Assuming 120 BPM for calculation (would use actual BPM in real implementation)
    const bpm = 120;
    const beatLength = 60 / bpm; // seconds per beat
    const loopDuration = beats * beatLength;
    
    onLoopChange({
      ...loop,
      enabled: true,
      start: currentTime,
      end: currentTime + loopDuration,
      length: loopDuration
    });
  };

  const clearLoop = () => {
    onLoopChange({
      enabled: false,
      start: 0,
      end: 0,
      length: 4
    });
  };

  const getLoopProgress = () => {
    if (!loop.enabled || loop.start === loop.end) return 0;
    const loopDuration = loop.end - loop.start;
    const positionInLoop = (currentTime - loop.start) % loopDuration;
    return (positionInLoop / loopDuration) * 100;
  };

  const isInLoop = () => {
    return loop.enabled && currentTime >= loop.start && currentTime <= loop.end;
  };

  const beatLoopSizes = [1, 2, 4, 8, 16, 32];

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Repeat className="h-5 w-5 text-primary" />
          Professional Looper - Deck {deckId}
          <Badge variant={loop.enabled ? "default" : "secondary"} className="ml-2">
            {loop.enabled ? "LOOP ON" : "LOOP OFF"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loop Status */}
        {loop.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Loop Progress</span>
              <Badge variant={isInLoop() ? "default" : "secondary"} className="text-xs">
                {isInLoop() ? "IN LOOP" : "OUT OF LOOP"}
              </Badge>
            </div>
            <Progress value={getLoopProgress()} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start: {formatTime(loop.start)}</span>
              <span>End: {formatTime(loop.end)}</span>
            </div>
          </div>
        )}

        {/* Manual Loop Controls */}
        <div className="space-y-3">
          <span className="text-sm font-medium">Manual Loop Setting</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={setLoopStart}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Target size={16} />
              Set Start
            </Button>
            <Button
              onClick={setLoopEnd}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Target size={16} />
              Set End
            </Button>
          </div>
        </div>

        {/* Auto Beat Loops */}
        <div className="space-y-3">
          <span className="text-sm font-medium">Auto Beat Loops</span>
          <div className="grid grid-cols-3 gap-2">
            {beatLoopSizes.map((beats) => (
              <Button
                key={beats}
                onClick={() => setAutoBeatLoop(beats)}
                size="sm"
                variant={loop.enabled && Math.abs(loop.end - loop.start - (beats * 0.5)) < 0.1 ? "default" : "outline"}
                className="text-xs"
              >
                {beats} Beat{beats > 1 ? 's' : ''}
              </Button>
            ))}
          </div>
        </div>

        {/* Loop Length Adjustment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Loop Length</span>
            <Badge variant="outline" className="text-xs">
              {formatTime(loop.length)}
            </Badge>
          </div>
          <Slider
            value={[loop.length]}
            onValueChange={([value]) => onLoopChange({ ...loop, length: value })}
            min={0.5}
            max={32}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5s</span>
            <span>32s</span>
          </div>
        </div>

        {/* Loop Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={enableLoop}
            variant={loop.enabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {loop.enabled ? <Square size={16} /> : <Play size={16} />}
            {loop.enabled ? "Disable Loop" : "Enable Loop"}
          </Button>
          
          <Button
            onClick={clearLoop}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw size={16} />
            Clear Loop
          </Button>
        </div>

        {/* Loop Visualization */}
        {loop.enabled && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Loop Timeline</span>
            <div className="h-8 bg-muted/30 rounded-lg relative overflow-hidden">
              {/* Loop region */}
              <div
                className="absolute top-1 bottom-1 bg-primary/30 rounded"
                style={{
                  left: `${(loop.start / 300) * 100}%`, // Assuming 5-minute max for visualization
                  width: `${((loop.end - loop.start) / 300) * 100}%`
                }}
              />
              
              {/* Current position */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent"
                style={{ left: `${(currentTime / 300) * 100}%` }}
              />
              
              {/* Loop markers */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary rounded-l"
                style={{ left: `${(loop.start / 300) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary rounded-r"
                style={{ left: `${(loop.end / 300) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Loop Info */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Loop Duration:</span>
            <p className="font-medium">{formatTime(loop.end - loop.start)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Current Time:</span>
            <p className="font-medium">{formatTime(currentTime)}</p>
          </div>
        </div>

        {/* Professional Features */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Manual and automatic beat-synced looping</p>
          <p>• Real-time loop progress visualization</p>
          <p>• Precise loop point setting and adjustment</p>
          <p>• Professional loop timeline display</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJLooper;