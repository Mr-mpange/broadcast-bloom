import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Play, 
  Plus, 
  Trash2, 
  Edit3, 
  SkipForward, 
  SkipBack,
  Target
} from 'lucide-react';

interface CuePoint {
  id: string;
  time: number;
  label: string;
  color: string;
}

interface DJCuePointsProps {
  deckId: string;
  cuePoints: CuePoint[];
  currentTime: number;
  onCuePointsChange: (cuePoints: CuePoint[]) => void;
}

const DJCuePoints = ({ deckId, cuePoints, currentTime, onCuePointsChange }: DJCuePointsProps) => {
  const [newCueLabel, setNewCueLabel] = useState('');
  const [editingCue, setEditingCue] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const cueColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addCuePoint = () => {
    const label = newCueLabel.trim() || `Cue ${cuePoints.length + 1}`;
    const color = cueColors[cuePoints.length % cueColors.length];
    
    const newCue: CuePoint = {
      id: Date.now().toString(),
      time: currentTime,
      label,
      color
    };

    const updatedCues = [...cuePoints, newCue].sort((a, b) => a.time - b.time);
    onCuePointsChange(updatedCues);
    setNewCueLabel('');
  };

  const deleteCuePoint = (id: string) => {
    const updatedCues = cuePoints.filter(cue => cue.id !== id);
    onCuePointsChange(updatedCues);
  };

  const editCuePoint = (id: string, newLabel: string) => {
    const updatedCues = cuePoints.map(cue => 
      cue.id === id ? { ...cue, label: newLabel } : cue
    );
    onCuePointsChange(updatedCues);
    setEditingCue(null);
    setEditLabel('');
  };

  const jumpToCue = (time: number) => {
    // This would trigger audio seeking in the parent component
    console.log(`Jump to cue at ${time}s`);
  };

  const getNextCue = () => {
    return cuePoints.find(cue => cue.time > currentTime);
  };

  const getPreviousCue = () => {
    return [...cuePoints].reverse().find(cue => cue.time < currentTime);
  };

  const jumpToNextCue = () => {
    const nextCue = getNextCue();
    if (nextCue) jumpToCue(nextCue.time);
  };

  const jumpToPreviousCue = () => {
    const prevCue = getPreviousCue();
    if (prevCue) jumpToCue(prevCue.time);
  };

  const clearAllCues = () => {
    onCuePointsChange([]);
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Cue Points - Deck {deckId}
          <Badge variant="secondary" className="ml-2 text-xs">
            {cuePoints.length} cues
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Cue Point */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cue label (optional)"
              value={newCueLabel}
              onChange={(e) => setNewCueLabel(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addCuePoint()}
            />
            <Button
              onClick={addCuePoint}
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              Add Cue
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current time: {formatTime(currentTime)}
          </p>
        </div>

        {/* Quick Navigation */}
        {cuePoints.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={jumpToPreviousCue}
              disabled={!getPreviousCue()}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <SkipBack size={16} />
              Prev Cue
            </Button>
            <Button
              onClick={jumpToNextCue}
              disabled={!getNextCue()}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <SkipForward size={16} />
              Next Cue
            </Button>
            <Button
              onClick={clearAllCues}
              size="sm"
              variant="outline"
              className="gap-2 ml-auto"
            >
              <Trash2 size={16} />
              Clear All
            </Button>
          </div>
        )}

        {/* Cue Points List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cuePoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cue points set</p>
              <p className="text-xs">Add cue points to mark important sections</p>
            </div>
          ) : (
            cuePoints.map((cue, index) => (
              <div
                key={cue.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cue.color }}
                />
                
                {/* Cue info */}
                <div className="flex-1 min-w-0">
                  {editingCue === cue.id ? (
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') editCuePoint(cue.id, editLabel);
                        if (e.key === 'Escape') setEditingCue(null);
                      }}
                      onBlur={() => editCuePoint(cue.id, editLabel)}
                      className="h-6 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="text-sm font-medium truncate">{cue.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(cue.time)} • Cue {index + 1}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => jumpToCue(cue.time)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Play size={14} />
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCue(cue.id);
                      setEditLabel(cue.label);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    onClick={() => deleteCuePoint(cue.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cue Point Timeline */}
        {cuePoints.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Cue Timeline</span>
            <div className="h-8 bg-muted/30 rounded-lg relative overflow-hidden">
              {cuePoints.map((cue) => (
                <div
                  key={cue.id}
                  className="absolute top-1 bottom-1 w-1 rounded-full cursor-pointer hover:w-2 transition-all"
                  style={{ 
                    backgroundColor: cue.color,
                    left: `${(cue.time / 300) * 100}%` // Assuming 5-minute max track length for visualization
                  }}
                  onClick={() => jumpToCue(cue.time)}
                  title={`${cue.label} - ${formatTime(cue.time)}`}
                />
              ))}
              {/* Current position indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent"
                style={{ left: `${(currentTime / 300) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Professional Features */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Unlimited cue points with custom labels</p>
          <p>• Color-coded markers for easy identification</p>
          <p>• Quick navigation between cue points</p>
          <p>• Visual timeline with precise positioning</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DJCuePoints;