import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
  groupId: string;
}

interface DiagnosticResult {
  deviceName: string;
  canAccess: boolean;
  isExclusive: boolean;
  error?: string;
  latency?: number;
}

const AudioDeviceDiagnostics = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Step 1: Enumerate devices
      toast({
        title: "Running Diagnostics...",
        description: "Scanning for audio devices",
      });

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs as DeviceInfo[]);

      // Step 2: Test each device
      const testResults: DiagnosticResult[] = [];

      for (const device of audioInputs) {
        if (!device.label || device.label === '') {
          testResults.push({
            deviceName: 'Unknown Device (Permission needed)',
            canAccess: false,
            isExclusive: false,
            error: 'Microphone permission not granted'
          });
          continue;
        }

        try {
          // Try to access device with shared mode settings
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: device.deviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 2,
              sampleRate: 48000
            }
          });

          // Get audio context to check latency
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const latency = audioContext.baseLatency || 0;

          testResults.push({
            deviceName: device.label,
            canAccess: true,
            isExclusive: false,
            latency: latency * 1000 // Convert to ms
          });

          // Clean up
          stream.getTracks().forEach(track => track.stop());
          await audioContext.close();

        } catch (error) {
          const err = error as Error;
          const errorMessage = err.message || err.toString();
          const isExclusiveError = 
            errorMessage.includes('in use') ||
            errorMessage.includes('busy') ||
            errorMessage.includes('exclusive') ||
            errorMessage.includes('NotReadableError');

          testResults.push({
            deviceName: device.label,
            canAccess: false,
            isExclusive: isExclusiveError,
            error: errorMessage
          });
        }
      }

      setResults(testResults);

      // Show summary
      const accessibleCount = testResults.filter(r => r.canAccess).length;
      const exclusiveCount = testResults.filter(r => r.isExclusive).length;

      if (exclusiveCount > 0) {
        toast({
          title: "⚠️ Exclusive Access Detected",
          description: `${exclusiveCount} device(s) are locked by another application`,
          variant: "destructive",
        });
      } else if (accessibleCount === testResults.length) {
        toast({
          title: "✅ All Devices Accessible",
          description: "No exclusive access issues found",
        });
      } else {
        toast({
          title: "Diagnostics Complete",
          description: `${accessibleCount}/${testResults.length} devices accessible`,
        });
      }

    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: "Could not complete device diagnostics",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result: DiagnosticResult) => {
    if (result.canAccess) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (result.isExclusive) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (result: DiagnosticResult) => {
    if (result.canAccess) {
      return <Badge variant="default" className="bg-green-500">Available</Badge>;
    } else if (result.isExclusive) {
      return <Badge variant="destructive">Exclusive Lock</Badge>;
    } else {
      return <Badge variant="secondary">Error</Badge>;
    }
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Activity className="h-5 w-5 text-primary" />
          Audio Device Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Test which audio devices are accessible and identify exclusive access issues
          </p>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="gap-2"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Testing...' : 'Run Test'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Test Results:</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border/50 bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-foreground truncate">
                          {result.deviceName}
                        </h5>
                        {getStatusBadge(result)}
                      </div>
                      
                      {result.canAccess && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>✅ Device is accessible in shared mode</p>
                          {result.latency !== undefined && (
                            <p>⏱️ Latency: {result.latency.toFixed(2)}ms</p>
                          )}
                        </div>
                      )}
                      
                      {result.isExclusive && (
                        <div className="text-sm text-red-400 space-y-1">
                          <p>❌ Device is locked by another application</p>
                          <p className="text-xs">
                            Close other audio software or disable exclusive mode
                          </p>
                        </div>
                      )}
                      
                      {!result.canAccess && !result.isExclusive && result.error && (
                        <div className="text-sm text-yellow-400">
                          <p>⚠️ {result.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <h5 className="text-sm font-medium mb-2 text-foreground">Summary:</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Devices:</span>
                  <p className="font-medium text-foreground">{results.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Accessible:</span>
                  <p className="font-medium text-green-500">
                    {results.filter(r => r.canAccess).length}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Locked:</span>
                  <p className="font-medium text-red-500">
                    {results.filter(r => r.isExclusive).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {results.some(r => r.isExclusive) && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <h5 className="text-sm font-medium mb-2 text-red-400">
                  ⚠️ Action Required:
                </h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Close your DJ software (Rekordbox, Serato, etc.)</li>
                  <li>• Disable exclusive mode in Windows Sound settings</li>
                  <li>• Or use Virtual Audio Cable for simultaneous access</li>
                  <li>• See troubleshooting guide below for detailed steps</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Click "Run Test" to diagnose audio device access</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioDeviceDiagnostics;
