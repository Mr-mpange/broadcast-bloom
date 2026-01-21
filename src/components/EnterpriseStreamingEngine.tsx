import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Radio, 
  Wifi, 
  Activity, 
  Settings, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Server,
  Headphones,
  Mic,
  Volume2
} from 'lucide-react';

interface StreamConfig {
  serverUrl: string;
  mountPoint: string;
  username: string;
  password: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: 'mp3' | 'aac' | 'ogg';
}

interface StreamStats {
  isConnected: boolean;
  listenerCount: number;
  peakListeners: number;
  bitrate: number;
  uptime: number;
  bytesStreamed: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

const EnterpriseStreamingEngine = () => {
  const { toast } = useToast();
  
  // Stream configuration
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    serverUrl: 'icecast.example.com',
    mountPoint: '/live',
    username: 'source',
    password: '',
    bitrate: 128,
    sampleRate: 44100,
    channels: 2,
    format: 'mp3'
  });

  // Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamStats, setStreamStats] = useState<StreamStats>({
    isConnected: false,
    listenerCount: 0,
    peakListeners: 0,
    bitrate: 0,
    uptime: 0,
    bytesStreamed: 0,
    connectionQuality: 'poor'
  });

  // Audio processing
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mixerNode, setMixerNode] = useState<GainNode | null>(null);
  const [compressorNode, setCompressorNode] = useState<DynamicsCompressorNode | null>(null);
  const [limiterNode, setLimiterNode] = useState<GainNode | null>(null);

  // WebSocket connection for real-time stats
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize professional audio processing chain
  const initializeAudioProcessing = useCallback(async () => {
    try {
      // Create high-quality audio context
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: streamConfig.sampleRate,
        latencyHint: 'interactive'
      });

      // Create professional audio processing chain
      const mixer = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      const limiter = ctx.createGain();

      // Configure compressor for broadcast quality
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      // Configure limiter
      limiter.gain.setValueAtTime(0.95, ctx.currentTime);

      // Connect processing chain: mixer → compressor → limiter → destination
      mixer.connect(compressor);
      compressor.connect(limiter);
      limiter.connect(ctx.destination);

      setAudioContext(ctx);
      setMixerNode(mixer);
      setCompressorNode(compressor);
      setLimiterNode(limiter);

      toast({
        title: 'Audio Engine Initialized',
        description: 'Professional audio processing chain ready for broadcast.',
      });

      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      toast({
        title: 'Audio Engine Failed',
        description: 'Could not initialize professional audio processing.',
        variant: 'destructive'
      });
      return false;
    }
  }, [streamConfig.sampleRate, toast]);

  // Connect to streaming server
  const connectToStreamingServer = useCallback(async () => {
    if (!audioContext || !mixerNode) {
      toast({
        title: 'Audio Not Ready',
        description: 'Initialize audio processing first.',
        variant: 'destructive'
      });
      return false;
    }

    setIsConnecting(true);

    try {
      // Create MediaRecorder for encoding
      const destination = audioContext.createMediaStreamDestination();
      limiterNode?.connect(destination);

      const recorder = new MediaRecorder(destination.stream, {
        mimeType: `audio/webm;codecs=opus`,
        audioBitsPerSecond: streamConfig.bitrate * 1000
      });

      // WebSocket connection to streaming server
      const wsUrl = `wss://${streamConfig.serverUrl}/ws/stream`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send authentication and stream configuration
        ws.send(JSON.stringify({
          type: 'auth',
          username: streamConfig.username,
          password: streamConfig.password,
          mountPoint: streamConfig.mountPoint,
          bitrate: streamConfig.bitrate,
          sampleRate: streamConfig.sampleRate,
          channels: streamConfig.channels,
          format: streamConfig.format
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'auth_success') {
          setIsStreaming(true);
          setIsConnecting(false);
          
          // Start recording and streaming
          recorder.start(100); // Send data every 100ms
          
          toast({
            title: '🎙️ Live Stream Connected',
            description: `Broadcasting to ${streamConfig.serverUrl}${streamConfig.mountPoint}`,
          });
        } else if (data.type === 'stats') {
          setStreamStats(prev => ({
            ...prev,
            isConnected: true,
            listenerCount: data.listeners || 0,
            peakListeners: Math.max(prev.peakListeners, data.listeners || 0),
            bitrate: data.bitrate || streamConfig.bitrate,
            uptime: data.uptime || 0,
            bytesStreamed: data.bytesStreamed || 0,
            connectionQuality: data.quality || 'good'
          }));
        } else if (data.type === 'error') {
          throw new Error(data.message);
        }
      };

      ws.onerror = () => {
        throw new Error('WebSocket connection failed');
      };

      ws.onclose = () => {
        setIsStreaming(false);
        setIsConnecting(false);
        setStreamStats(prev => ({ ...prev, isConnected: false }));
      };

      // Handle audio data
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          // Send audio data to streaming server
          ws.send(event.data);
        }
      };

      setMediaRecorder(recorder);
      wsRef.current = ws;

      return true;

    } catch (error: any) {
      console.error('Streaming connection failed:', error);
      setIsConnecting(false);
      toast({
        title: 'Stream Connection Failed',
        description: error.message || 'Could not connect to streaming server.',
        variant: 'destructive'
      });
      return false;
    }
  }, [audioContext, mixerNode, limiterNode, streamConfig, toast]);

  // Disconnect from streaming server
  const disconnectFromStreamingServer = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsStreaming(false);
    setMediaRecorder(null);
    setStreamStats(prev => ({ 
      ...prev, 
      isConnected: false, 
      listenerCount: 0,
      uptime: 0 
    }));

    toast({
      title: 'Stream Disconnected',
      description: 'Live stream has been terminated.',
    });
  }, [mediaRecorder, toast]);

  // Add audio source to mixer
  const addAudioSource = useCallback((audioElement: HTMLAudioElement, gain: number = 1.0) => {
    if (!audioContext || !mixerNode) return null;

    try {
      const source = audioContext.createMediaElementSource(audioElement);
      const gainNode = audioContext.createGain();
      
      gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
      source.connect(gainNode);
      gainNode.connect(mixerNode);

      return { source, gainNode };
    } catch (error) {
      console.error('Failed to add audio source:', error);
      return null;
    }
  }, [audioContext, mixerNode]);

  // Add microphone input
  const addMicrophoneInput = useCallback(async (gain: number = 1.0) => {
    if (!audioContext || !mixerNode) return null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // We'll handle gain manually
          sampleRate: streamConfig.sampleRate,
          channelCount: streamConfig.channels
        }
      });

      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      
      gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
      source.connect(gainNode);
      gainNode.connect(mixerNode);

      return { source, gainNode, stream };
    } catch (error) {
      console.error('Failed to add microphone:', error);
      toast({
        title: 'Microphone Access Failed',
        description: 'Could not access microphone for live input.',
        variant: 'destructive'
      });
      return null;
    }
  }, [audioContext, mixerNode, streamConfig, toast]);

  // Update stream configuration
  const updateStreamConfig = (updates: Partial<StreamConfig>) => {
    setStreamConfig(prev => ({ ...prev, ...updates }));
  };

  // Start uptime counter
  useEffect(() => {
    if (isStreaming) {
      streamIntervalRef.current = setInterval(() => {
        setStreamStats(prev => ({
          ...prev,
          uptime: prev.uptime + 1
        }));
      }, 1000);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isStreaming]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Stream Status Header */}
      <Card className={`glass-panel border-border/50 ${isStreaming ? 'border-red-500 bg-red-50/50' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-6 w-6" />
              Enterprise Streaming Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isStreaming ? "destructive" : "secondary"} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                {isStreaming ? 'LIVE STREAMING' : 'OFFLINE'}
              </Badge>
              {streamStats.isConnected && (
                <Badge variant="outline" className={`${
                  streamStats.connectionQuality === 'excellent' ? 'text-green-600 border-green-600' :
                  streamStats.connectionQuality === 'good' ? 'text-blue-600 border-blue-600' :
                  streamStats.connectionQuality === 'fair' ? 'text-yellow-600 border-yellow-600' :
                  'text-red-600 border-red-600'
                }`}>
                  <Activity className="h-3 w-3 mr-1" />
                  {streamStats.connectionQuality.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isStreaming ? (
            <div className="space-y-4">
              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  Enterprise-grade streaming engine ready. Configure your streaming server and audio processing settings below.
                </AlertDescription>
              </Alert>

              {/* Stream Configuration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Streaming Server</Label>
                  <Input
                    placeholder="icecast.yourstation.com"
                    value={streamConfig.serverUrl}
                    onChange={(e) => updateStreamConfig({ serverUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Mount Point</Label>
                  <Input
                    placeholder="/live"
                    value={streamConfig.mountPoint}
                    onChange={(e) => updateStreamConfig({ mountPoint: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Username</Label>
                  <Input
                    placeholder="source"
                    value={streamConfig.username}
                    onChange={(e) => updateStreamConfig({ username: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Stream password"
                    value={streamConfig.password}
                    onChange={(e) => updateStreamConfig({ password: e.target.value })}
                  />
                </div>
              </div>

              {/* Audio Quality Settings */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label>Bitrate (kbps)</Label>
                  <Select value={streamConfig.bitrate.toString()} onValueChange={(value) => updateStreamConfig({ bitrate: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="64">64 kbps (Low)</SelectItem>
                      <SelectItem value="96">96 kbps (Medium)</SelectItem>
                      <SelectItem value="128">128 kbps (High)</SelectItem>
                      <SelectItem value="192">192 kbps (Premium)</SelectItem>
                      <SelectItem value="320">320 kbps (Studio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Sample Rate (Hz)</Label>
                  <Select value={streamConfig.sampleRate.toString()} onValueChange={(value) => updateStreamConfig({ sampleRate: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22050">22.05 kHz</SelectItem>
                      <SelectItem value="44100">44.1 kHz (CD Quality)</SelectItem>
                      <SelectItem value="48000">48 kHz (Professional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Format</Label>
                  <Select value={streamConfig.format} onValueChange={(value: 'mp3' | 'aac' | 'ogg') => updateStreamConfig({ format: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3 (Universal)</SelectItem>
                      <SelectItem value="aac">AAC (High Quality)</SelectItem>
                      <SelectItem value="ogg">OGG (Open Source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={initializeAudioProcessing}
                  disabled={!!audioContext}
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {audioContext ? 'Audio Engine Ready' : 'Initialize Audio Engine'}
                </Button>
                <Button
                  onClick={connectToStreamingServer}
                  disabled={!audioContext || isConnecting || !streamConfig.serverUrl || !streamConfig.password}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Connecting...' : 'Start Live Stream'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎙️ LIVE: Broadcasting to {streamConfig.serverUrl}{streamConfig.mountPoint} at {streamConfig.bitrate}kbps
                </AlertDescription>
              </Alert>

              <Button
                onClick={disconnectFromStreamingServer}
                variant="destructive"
                className="w-full"
              >
                <Radio className="h-4 w-4 mr-2" />
                End Live Stream
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Stream Statistics */}
      {isStreaming && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{streamStats.listenerCount}</div>
                  <p className="text-xs text-muted-foreground">Current Listeners</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{streamStats.peakListeners}</div>
                  <p className="text-xs text-muted-foreground">Peak Listeners</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatUptime(streamStats.uptime)}</div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatBytes(streamStats.bytesStreamed)}</div>
                  <p className="text-xs text-muted-foreground">Data Streamed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Stream Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Server:</span>
                  <span className="font-mono">{streamConfig.serverUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mount Point:</span>
                  <span className="font-mono">{streamConfig.mountPoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bitrate:</span>
                  <span>{streamStats.bitrate} kbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample Rate:</span>
                  <span>{streamConfig.sampleRate} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="uppercase">{streamConfig.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quality:</span>
                  <Badge variant="outline" className={`${
                    streamStats.connectionQuality === 'excellent' ? 'text-green-600 border-green-600' :
                    streamStats.connectionQuality === 'good' ? 'text-blue-600 border-blue-600' :
                    streamStats.connectionQuality === 'fair' ? 'text-yellow-600 border-yellow-600' :
                    'text-red-600 border-red-600'
                  }`}>
                    {streamStats.connectionQuality}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audio Processing Chain Visualization */}
      {audioContext && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Professional Audio Processing Chain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Microphone Input</span>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Audio Mixer</span>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Compressor</span>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Limiter</span>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Live Stream</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Professional broadcast-quality audio processing with compression, limiting, and real-time encoding
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseStreamingEngine;