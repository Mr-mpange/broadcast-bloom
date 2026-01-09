import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Activity, Target, RotateCcw } from 'lucide-react';
import type { DeckState } from './DJMixer';

interface DJBeatSyncProps {
  deckA: DeckState;
  deckB: DeckState;
  syncEnabled: boolean;
  onSync: () => void;
  onSyncToggle: (enabled: boolean) => void;
}

const DJBeatSync = ({ deckA, deckB, syncEnabled, onSync, onSyncToggle }: DJBeatSyncProps) => {
  const getBPMDifference = () => {
    if (!deckA.track || !deckB.track) return 0;
    const bpmA = (deckA.track.bpm || 120) * deckA.tempo;
    const bpmB = (deckB.track.bpm || 120) * deckB.tempo;
    return Math.abs(bpmA - bpmB);
  };

  const getSyncAccuracy = () => {
    const bpmDiff = getBPMDifference();
    if (bpmDiff === 0) return 100;
    if (bpmDiff < 0.1) return 95;
    if (bpmDiff < 0.5) return 85;
    if (bpmDiff < 1) return 70;
    if (bpmDiff < 2) return 50;
    return 25;
  };

  const getBeatPhase = (deck: DeckState) => {
    if (!deck.track || !deck.isPlaying) return 0;
    const bpm = (deck.track.bpm || 120) * deck.tempo;
    const beatLength = 60 / bpm; // seconds per beat
    const phase = (deck.currentTime % beatLength) / beatLength;
    return phase * 100;
  };

  const getSyncRecommendation = () => {
    const bpmDiff = getBPMDifference();
    if (bpmDiff === 0) return "Perfect sync";
    if (bpmDiff < 0.1) return "Excellent sync";
    if (bpmDiff < 0.5) return "Good sync";
    if (bpmDiff < 1) return "Adjust tempo slightly";
    if (bpmDiff < 2) return "Significant tempo difference";
    return "Major tempo adjustment needed";
  };

  const getSyncColor = () => {
    const accuracy = getSyncAccuracy();
    if (accuracy >= 90) return "text-green-500";
    if (accuracy >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const deckAPhase = getBeatPhase(deckA);
  const deckBPhase = getBeatPhase(deckB);
  const syncAccuracy = getSyncAccuracy();
  const bpmDiff = getBPMDifference();

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-primary" />
          Beat Sync & BPM Matching
          <Badge variant={syncEnabled ? "default" : "secondary"} className="ml-2">
            {syncEnabled ? "SYNC ON" : "SYNC OFF"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BPM Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Deck A BPM</span>
              <Badge variant="outline" className="text-xs">
                {deckA.track ? ((deckA.track.bpm || 120) * deckA.tempo).toFixed(1) : '--'}
              </Badge>
            </div>
            {deckA.isPlaying && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Beat Phase</span>
                  <span>{deckAPhase.toFixed(0)}%</span>
                </div>
                <Progress value={deckAPhase} className="h-2" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Deck B BPM</span>
              <Badge variant="outline" className="text-xs">
                {deckB.track ? ((deckB.track.bpm || 120) * deckB.tempo).toFixed(1) : '--'}
              </Badge>
            </div>
            {deckB.isPlaying && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Beat Phase</span>
                  <span>{deckBPhase.toFixed(0)}%</span>
                </div>
                <Progress value={deckBPhase} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sync Accuracy</span>
            <Badge variant={syncAccuracy >= 90 ? "default" : "secondary"} className={`text-xs ${getSyncColor()}`}>
              {syncAccuracy.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={syncAccuracy} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>BPM Difference: {bpmDiff.toFixed(2)}</span>
            <span className={getSyncColor()}>{getSyncRecommendation()}</span>
          </div>
        </div>

        {/* Beat Alignment Visualization */}
        {(deckA.isPlaying || deckB.isPlaying) && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Beat Alignment</span>
            <div className="h-12 bg-muted/30 rounded-lg p-2 relative overflow-hidden">
              <div className="flex items-center h-full">
                {/* Deck A beat indicator */}
                <div className="flex-1 relative">
                  <div className="text-xs text-muted-foreground mb-1">Deck A</div>
                  <div className="h-2 bg-muted rounded-full relative">
                    <div 
                      className="absolute top-0 w-1 h-full bg-primary rounded-full transition-all duration-100"
                      style={{ left: `${deckAPhase}%` }}
                    />
                  </div>
                </div>
                
                <div className="mx-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                
                {/* Deck B beat indicator */}
                <div className="flex-1 relative">
                  <div className="text-xs text-muted-foreground mb-1">Deck B</div>
                  <div className="h-2 bg-muted rounded-full relative">
                    <div 
                      className="absolute top-0 w-1 h-full bg-secondary rounded-full transition-all duration-100"
                      style={{ left: `${deckBPhase}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onSync}
            disabled={!deckA.track || !deckB.track}
            variant={syncAccuracy >= 90 ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Target size={16} />
            Sync Beats
          </Button>
          
          <Button
            onClick={() => onSyncToggle(!syncEnabled)}
            variant={syncEnabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Zap size={16} />
            {syncEnabled ? "Disable Sync" : "Enable Sync"}
          </Button>
        </div>

        {/* Professional Features */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Automatic BPM detection and matching</p>
          <p>• Real-time beat phase visualization</p>
          <p>• Professional sync algorithms</p>
          <p>• Beat-accurate mixing assistance</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJBeatSync;