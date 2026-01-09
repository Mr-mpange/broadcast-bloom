import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Waves, Filter, RotateCcw } from 'lucide-react';

interface Effects {
  reverb: number;
  delay: number;
  filter: number;
  flanger: number;
}

interface DJEffectsRackProps {
  deckAEffects: Effects;
  deckBEffects: Effects;
  onDeckAEffectsChange: (effects: Effects) => void;
  onDeckBEffectsChange: (effects: Effects) => void;
}

const DJEffectsRack = ({ 
  deckAEffects, 
  deckBEffects, 
  onDeckAEffectsChange, 
  onDeckBEffectsChange 
}: DJEffectsRackProps) => {
  
  const effectPresets = {
    clean: { reverb: 0, delay: 0, filter: 0, flanger: 0 },
    space: { reverb: 60, delay: 30, filter: 0, flanger: 0 },
    dub: { reverb: 40, delay: 70, filter: -20, flanger: 0 },
    psychedelic: { reverb: 30, delay: 50, filter: 10, flanger: 60 },
    filterSweep: { reverb: 10, delay: 20, filter: 40, flanger: 0 },
    breakdown: { reverb: 80, delay: 60, filter: -30, flanger: 30 }
  };

  const applyPreset = (deck: 'A' | 'B', presetName: keyof typeof effectPresets) => {
    const preset = effectPresets[presetName];
    if (deck === 'A') {
      onDeckAEffectsChange(preset);
    } else {
      onDeckBEffectsChange(preset);
    }
  };

  const EffectControls = ({ 
    effects, 
    onChange, 
    deckId 
  }: { 
    effects: Effects; 
    onChange: (effects: Effects) => void; 
    deckId: string;
  }) => (
    <div className="space-y-4">
      {/* Effect Presets */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Effect Presets</span>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(effectPresets).map((presetName) => (
            <Button
              key={presetName}
              size="sm"
              variant="outline"
              onClick={() => applyPreset(deckId as 'A' | 'B', presetName as keyof typeof effectPresets)}
              className="text-xs capitalize"
            >
              {presetName.replace(/([A-Z])/g, ' $1').trim()}
            </Button>
          ))}
        </div>
      </div>

      {/* Individual Effect Controls */}
      <div className="space-y-4">
        {/* Reverb */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Waves size={16} />
              Reverb
            </span>
            <Badge variant={effects.reverb > 0 ? "default" : "secondary"} className="text-xs">
              {effects.reverb}%
            </Badge>
          </div>
          <Slider
            value={[effects.reverb]}
            onValueChange={([value]) => onChange({ ...effects, reverb: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Delay */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <RotateCcw size={16} />
              Delay
            </span>
            <Badge variant={effects.delay > 0 ? "default" : "secondary"} className="text-xs">
              {effects.delay}%
            </Badge>
          </div>
          <Slider
            value={[effects.delay]}
            onValueChange={([value]) => onChange({ ...effects, delay: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Filter size={16} />
              Filter
            </span>
            <Badge 
              variant={effects.filter !== 0 ? "default" : "secondary"} 
              className="text-xs"
            >
              {effects.filter > 0 ? 'HPF' : effects.filter < 0 ? 'LPF' : 'OFF'} {Math.abs(effects.filter)}
            </Badge>
          </div>
          <Slider
            value={[effects.filter]}
            onValueChange={([value]) => onChange({ ...effects, filter: value })}
            min={-50}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low Pass</span>
            <span>Neutral</span>
            <span>High Pass</span>
          </div>
        </div>

        {/* Flanger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap size={16} />
              Flanger
            </span>
            <Badge variant={effects.flanger > 0 ? "default" : "secondary"} className="text-xs">
              {effects.flanger}%
            </Badge>
          </div>
          <Slider
            value={[effects.flanger]}
            onValueChange={([value]) => onChange({ ...effects, flanger: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Reset All Effects */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(effectPresets.clean)}
        className="w-full gap-2"
      >
        <RotateCcw size={16} />
        Reset All Effects
      </Button>
    </div>
  );

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-primary" />
          Professional Effects Rack
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deckA" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deckA" className="flex items-center gap-2">
              Deck A Effects
              {(deckAEffects.reverb > 0 || deckAEffects.delay > 0 || deckAEffects.filter !== 0 || deckAEffects.flanger > 0) && (
                <Badge variant="default" className="text-xs">ON</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deckB" className="flex items-center gap-2">
              Deck B Effects
              {(deckBEffects.reverb > 0 || deckBEffects.delay > 0 || deckBEffects.filter !== 0 || deckBEffects.flanger > 0) && (
                <Badge variant="default" className="text-xs">ON</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deckA" className="mt-4">
            <EffectControls
              effects={deckAEffects}
              onChange={onDeckAEffectsChange}
              deckId="A"
            />
          </TabsContent>
          
          <TabsContent value="deckB" className="mt-4">
            <EffectControls
              effects={deckBEffects}
              onChange={onDeckBEffectsChange}
              deckId="B"
            />
          </TabsContent>
        </Tabs>

        {/* Effects Chain Visualization */}
        <div className="mt-6 space-y-2">
          <span className="text-sm font-medium">Active Effects Chain</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Deck A</span>
              <div className="flex gap-1 flex-wrap">
                {deckAEffects.reverb > 0 && <Badge variant="default" className="text-xs">Reverb</Badge>}
                {deckAEffects.delay > 0 && <Badge variant="default" className="text-xs">Delay</Badge>}
                {deckAEffects.filter !== 0 && <Badge variant="default" className="text-xs">Filter</Badge>}
                {deckAEffects.flanger > 0 && <Badge variant="default" className="text-xs">Flanger</Badge>}
                {!(deckAEffects.reverb > 0 || deckAEffects.delay > 0 || deckAEffects.filter !== 0 || deckAEffects.flanger > 0) && (
                  <Badge variant="secondary" className="text-xs">Clean</Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Deck B</span>
              <div className="flex gap-1 flex-wrap">
                {deckBEffects.reverb > 0 && <Badge variant="default" className="text-xs">Reverb</Badge>}
                {deckBEffects.delay > 0 && <Badge variant="default" className="text-xs">Delay</Badge>}
                {deckBEffects.filter !== 0 && <Badge variant="default" className="text-xs">Filter</Badge>}
                {deckBEffects.flanger > 0 && <Badge variant="default" className="text-xs">Flanger</Badge>}
                {!(deckBEffects.reverb > 0 || deckBEffects.delay > 0 || deckBEffects.filter !== 0 || deckBEffects.flanger > 0) && (
                  <Badge variant="secondary" className="text-xs">Clean</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJEffectsRack;