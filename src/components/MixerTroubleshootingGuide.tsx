import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const MixerTroubleshootingGuide = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const troubleshootingSteps = [
    {
      id: 'exclusive-mode',
      title: '1. Disable Exclusive Mode in Windows',
      problem: 'Mixer is locked by one application',
      solution: [
        'Right-click speaker icon → "Open Sound settings"',
        'Click "Sound Control Panel"',
        'Go to "Recording" tab → Find your mixer',
        'Right-click → Properties → Advanced tab',
        'UNCHECK "Allow applications to take exclusive control"',
        'Click Apply → OK',
        'Restart your computer'
      ],
      icon: '🔧'
    },
    {
      id: 'dj-software',
      title: '2. Configure Your DJ Software',
      problem: 'DJ software using exclusive access',
      solution: [
        'Open your DJ software (Rekordbox, Serato, Traktor, etc.)',
        'Go to Audio/Preferences settings',
        'Find "Exclusive Mode" option',
        'UNCHECK or DISABLE exclusive mode',
        'Increase buffer size to 512 or higher',
        'Click Apply and restart software'
      ],
      icon: '🎛️'
    },
    {
      id: 'browser',
      title: '3. Configure Browser Settings',
      problem: 'Browser requesting exclusive access',
      solution: [
        'Chrome/Edge: Go to chrome://flags or edge://flags',
        'Search for "Exclusive audio"',
        'Set to DISABLED',
        'Restart browser',
        'Firefox: Type about:config',
        'Search "media.getusermedia.audio.exclusive"',
        'Set to FALSE'
      ],
      icon: '🌐'
    },
    {
      id: 'virtual-cable',
      title: '4. Use Virtual Audio Cable (Recommended)',
      problem: 'Need guaranteed simultaneous access',
      solution: [
        'Download VB-Audio Cable from vb-audio.com/Cable/',
        'Install and restart computer',
        'Set DJ software output to "CABLE Input"',
        'Set PULSE FM input to "CABLE Output"',
        'Now both can work together perfectly!',
        'See full guide in MIXER_SHARED_ACCESS_GUIDE.md'
      ],
      icon: '🔊',
      recommended: true
    }
  ];

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Mixer Connection Issues?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            If your mixer works in your DJ software OR in PULSE FM but not both at the same time,
            this is an <strong>exclusive access</strong> issue. Follow the steps below to fix it.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {troubleshootingSteps.map((step) => (
            <div key={step.id} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(step.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <div className="text-left">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      {step.title}
                      {step.recommended && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.problem}</p>
                  </div>
                </div>
                {expandedSection === step.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {expandedSection === step.id && (
                <div className="p-4 pt-0 space-y-2">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h5 className="text-sm font-medium mb-3 text-foreground">Steps to fix:</h5>
                    <ol className="space-y-2">
                      {step.solution.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>Quick Fix:</strong> The easiest solution is to use Virtual Audio Cable (Step 4).
            This lets your DJ software and PULSE FM work together without any conflicts.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open('/MIXER_SHARED_ACCESS_GUIDE.md', '_blank')}
          >
            <ExternalLink size={14} />
            View Full Setup Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open('https://vb-audio.com/Cable/', '_blank')}
          >
            <ExternalLink size={14} />
            Download Virtual Cable
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
          <p><strong>Why this happens:</strong> Windows opens audio devices in "exclusive mode" by default, 
          meaning only one app can use them at a time.</p>
          <p><strong>The fix:</strong> Either disable exclusive mode everywhere, or use a virtual audio cable 
          to route audio between applications.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MixerTroubleshootingGuide;
