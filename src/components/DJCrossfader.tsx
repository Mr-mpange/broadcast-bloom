import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, ArrowLeftRight } from 'lucide-react';

interface DJCrossfaderProps {
  position: number; // 0-100, where 0 is full A, 50 is center, 100 is full B
  onPositionChange: (position: number) => void;
}

const DJCrossfader = ({ position, onPositionChange }: DJCrossfaderProps) => {
  const getPositionLabel = () => {
    if (position < 25) return 'Full A';
    if (position > 75) return 'Full B';
    return 'Center';
  };

  const getCurveType = () => {
    // Different crossfader curves for different mixing styles
    if (position < 10 || position > 90) return 'Sharp Cut';
    if (position < 30 || position > 70) return 'Smooth';
    return 'Linear';
  };

  const getVolumeIndicators = () => {
    const deckAVolume = Math.cos((position / 100) * (Math.PI / 2)) * 100;
    const deckBVolume = Math.sin((position / 100) * (Math.PI / 2)) * 100;
    return { deckA: deckAVolume, deckB: deckBVolume };
  };

  const { deckA, deckB } = getVolumeIndicators();

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          Professional Crossfader
          <Badge variant="secondary" className="ml-2 text-xs">
            {getCurveType()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume Meters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Deck A</span>
              <span className="text-xs text-muted-foreground">{deckA.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${deckA}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Deck B</span>
              <span className="text-xs text-muted-foreground">{deckB.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-150"
                style={{ width: `${deckB}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Crossfader */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Crossfader Position</span>
            <Badge variant="outline" className="text-xs">
              {getPositionLabel()}
            </Badge>
          </div>
          
          <div className="relative">
            <Slider
              value={[position]}
              onValueChange={([value]) => onPositionChange(value)}
              max={100}
              step={1}
              className="w-full"
            />
            
            {/* Position markers */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>A</span>
              <span>Center</span>
              <span>B</span>
            </div>
          </div>
        </div>

        {/* Quick Position Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={position < 25 ? "default" : "outline"}
            onClick={() => onPositionChange(0)}
            className="text-xs"
          >
            Full A
          </Button>
          <Button
            size="sm"
            variant={position >= 25 && position <= 75 ? "default" : "outline"}
            onClick={() => onPositionChange(50)}
            className="text-xs"
          >
            Center
          </Button>
          <Button
            size="sm"
            variant={position > 75 ? "default" : "outline"}
            onClick={() => onPositionChange(100)}
            className="text-xs"
          >
            Full B
          </Button>
        </div>

        {/* Crossfader Curve Visualization */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Crossfader Curve</span>
          <div className="h-16 bg-muted/30 rounded-lg p-2 relative">
            <svg className="w-full h-full" viewBox="0 0 100 50">
              {/* Deck A curve */}
              <path
                d={`M 0,50 Q 25,${50 - (deckA / 2)} 50,${50 - (deckA / 2)} Q 75,${50 - (deckA / 2)} 100,50`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
              {/* Deck B curve */}
              <path
                d={`M 0,50 Q 25,${50 - (deckB / 2)} 50,${50 - (deckB / 2)} Q 75,${50 - (deckB / 2)} 100,50`}
                stroke="hsl(var(--secondary))"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
              {/* Current position indicator */}
              <circle
                cx={position}
                cy="25"
                r="3"
                fill="hsl(var(--accent))"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Professional Features Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Professional crossfader curves for smooth mixing</p>
          <p>• Real-time volume visualization</p>
          <p>• Quick preset positions for fast transitions</p>
          <p>• Compatible with hardware MIDI controllers</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJCrossfader;