import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Equalizer, Volume2, VolumeX } from 'lucide-react';

interface EQSettings {
  high: number;
  mid: number;
  low: number;
}

interface DJEqualizerProps {
  deckId: string;
  eq: EQSettings;
  onEQChange: (eq: EQSettings) => void;
}

const DJEqualizer = ({ deckId, eq, onEQChange }: DJEqualizerProps) => {
  const eqPresets = {
    flat: { high: 0, mid: 0, low: 0 },
    bassBoost: { high: -5, mid: 0, low: 15 },
    vocalCut: { high: 5, mid: -20, low: 5 },
    warm: { high: -3, mid: 2, low: 8 },
    bright: { high: 12, mid: 3, low: -2 },
    scooped: { high: 8, mid: -15, low: 8 }
  };

  const applyPreset = (presetName: keyof typeof eqPresets) => {
    onEQChange(eqPresets[presetName]);
  };

  const resetEQ = () => {
    onEQChange(eqPresets.flat);
  };

  const killBand = (band: keyof EQSettings) => {
    const newEQ = { ...eq };
    newEQ[band] = newEQ[band] === -30 ? 0 : -30; // Toggle between kill (-30dB) and neutral
    onEQChange(newEQ);
  };

  const getFrequencyLabel = (band: keyof EQSettings) => {
    switch (band) {
      case 'high': return 'HIGH (8kHz+)';
      case 'mid': return 'MID (800Hz-8kHz)';
      case 'low': return 'LOW (80Hz-800Hz)';
      default: return '';
    }
  };

  const getEQColor = (value: number) => {
    if (value > 10) return 'text-red-500';
    if (value > 0) return 'text-yellow-500';
    if (value < -10) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Equalizer className="h-5 w-5 text-primary" />
          3-Band EQ - Deck {deckId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* EQ Presets */}
        <div className="space-y-2">
          <span className="text-sm font-medium">EQ Presets</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(eqPresets).map((presetName) => (
              <Button
                key={presetName}
                size="sm"
                variant="outline"
                onClick={() => applyPreset(presetName as keyof typeof eqPresets)}
                className="text-xs capitalize"
              >
                {presetName.replace(/([A-Z])/g, ' $1').trim()}
              </Button>
            ))}
          </div>
        </div>

        {/* EQ Controls */}
        <div className="space-y-4">
          {/* High Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getFrequencyLabel('high')}</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={eq.high !== 0 ? "default" : "secondary"} 
                  className={`text-xs ${getEQColor(eq.high)}`}
                >
                  {eq.high > 0 ? '+' : ''}{eq.high.toFixed(1)}dB
                </Badge>
                <Button
                  size="sm"
                  variant={eq.high === -30 ? "destructive" : "outline"}
                  onClick={() => killBand('high')}
                  className="px-2 py-1 text-xs"
                >
                  KILL
                </Button>
              </div>
            </div>
            <Slider
              value={[eq.high]}
              onValueChange={([value]) => onEQChange({ ...eq, high: value })}
              min={-30}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Mid Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getFrequencyLabel('mid')}</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={eq.mid !== 0 ? "default" : "secondary"} 
                  className={`text-xs ${getEQColor(eq.mid)}`}
                >
                  {eq.mid > 0 ? '+' : ''}{eq.mid.toFixed(1)}dB
                </Badge>
                <Button
                  size="sm"
                  variant={eq.mid === -30 ? "destructive" : "outline"}
                  onClick={() => killBand('mid')}
                  className="px-2 py-1 text-xs"
                >
                  KILL
                </Button>
              </div>
            </div>
            <Slider
              value={[eq.mid]}
              onValueChange={([value]) => onEQChange({ ...eq, mid: value })}
              min={-30}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Low Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getFrequencyLabel('low')}</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={eq.low !== 0 ? "default" : "secondary"} 
                  className={`text-xs ${getEQColor(eq.low)}`}
                >
                  {eq.low > 0 ? '+' : ''}{eq.low.toFixed(1)}dB
                </Badge>
                <Button
                  size="sm"
                  variant={eq.low === -30 ? "destructive" : "outline"}
                  onClick={() => killBand('low')}
                  className="px-2 py-1 text-xs"
                >
                  KILL
                </Button>
              </div>
            </div>
            <Slider
              value={[eq.low]}
              onValueChange={([value]) => onEQChange({ ...eq, low: value })}
              min={-30}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        {/* EQ Curve Visualization */}
        <div className="space-y-2">
          <span className="text-sm font-medium">EQ Curve</span>
          <div className="h-20 bg-muted/30 rounded-lg p-2 relative">
            <svg className="w-full h-full" viewBox="0 0 300 80">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="30" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 8" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="300" height="80" fill="url(#grid)" />
              
              {/* Zero line */}
              <line x1="0" y1="40" x2="300" y2="40" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
              
              {/* EQ Curve */}
              <path
                d={`M 0,${40 - eq.low} Q 100,${40 - eq.low} 100,${40 - eq.mid} Q 200,${40 - eq.mid} 200,${40 - eq.high} Q 300,${40 - eq.high} 300,${40 - eq.high}`}
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
              />
              
              {/* Frequency markers */}
              <circle cx="100" cy={40 - eq.low} r="3" fill="hsl(var(--primary))" />
              <circle cx="200" cy={40 - eq.mid} r="3" fill="hsl(var(--primary))" />
              <circle cx="300" cy={40 - eq.high} r="3" fill="hsl(var(--primary))" />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>LOW</span>
            <span>MID</span>
            <span>HIGH</span>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetEQ}
          className="w-full gap-2"
        >
          <Volume2 size={16} />
          Reset EQ (Flat)
        </Button>

        {/* Professional Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Professional 3-band EQ with kill switches</p>
          <p>• Range: -30dB to +20dB per band</p>
          <p>• Real-time frequency curve visualization</p>
          <p>• Industry-standard frequency ranges</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJEqualizer;