import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface HardwareStatus {
  crossfader: number;
  channel1Volume: number;
  channel2Volume: number;
  masterVolume: number;
  micLevel: number;
  isLive: boolean;
  bpm: number;
  currentTrack?: string;
  lastControlChange?: {
    control: number;
    value: number;
    timestamp: number;
  };
}

interface MixerDevice {
  id: string;
  name: string;
  type: 'midi' | 'audio' | 'usb';
  connected: boolean;
}

export const useHardwareMixer = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<MixerDevice[]>([]);
  const [activeDevice, setActiveDevice] = useState<MixerDevice | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>({
    crossfader: 50,
    channel1Volume: 75,
    channel2Volume: 75,
    masterVolume: 80,
    micLevel: 0,
    isLive: false,
    bpm: 120
  });
  const [isScanning, setIsScanning] = useState(false);

  // Scan for hardware devices
  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    const foundDevices: MixerDevice[] = [];

    try {
      // Scan for MIDI devices
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = Array.from(midiAccess.inputs.values());
        
        inputs.forEach((input: any) => {
          if (input.name && (
            input.name.toLowerCase().includes('dj') ||
            input.name.toLowerCase().includes('mixer') ||
            input.name.toLowerCase().includes('pioneer') ||
            input.name.toLowerCase().includes('numark') ||
            input.name.toLowerCase().includes('denon') ||
            input.name.toLowerCase().includes('behringer')
          )) {
            foundDevices.push({
              id: input.id,
              name: input.name,
              type: 'midi',
              connected: input.state === 'connected'
            });
          }
        });
      }

      // Scan for Audio devices
      if (navigator.mediaDevices) {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = mediaDevices.filter(device => device.kind === 'audioinput');
        
        audioInputs.forEach(device => {
          if (device.label && (
            device.label.toLowerCase().includes('mixer') ||
            device.label.toLowerCase().includes('dj') ||
            device.label.toLowerCase().includes('pioneer') ||
            device.label.toLowerCase().includes('behringer') ||
            device.label.toLowerCase().includes('focusrite')
          )) {
            foundDevices.push({
              id: device.deviceId,
              name: device.label,
              type: 'audio',
              connected: true
            });
          }
        });
      }

      setDevices(foundDevices);
      
      if (foundDevices.length > 0 && !activeDevice) {
        // Auto-connect to first available device
        connectToDevice(foundDevices[0]);
      }

    } catch (error) {
      console.error('Device scan failed:', error);
      toast({
        title: "Hardware Scan Failed",
        description: "Could not scan for hardware devices",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  }, [activeDevice, toast]);

  // Connect to a specific device
  const connectToDevice = useCallback(async (device: MixerDevice) => {
    try {
      if (device.type === 'midi') {
        const midiAccess = await navigator.requestMIDIAccess();
        const midiInput = midiAccess.inputs.get(device.id);
        
        if (midiInput) {
          // Set up MIDI message listener
          midiInput.onmidimessage = (message: any) => {
            handleMIDIMessage(message.data);
          };
          
          setActiveDevice(device);
          toast({
            title: "Hardware Connected!",
            description: `Connected to ${device.name}`,
          });
        }
      } else if (device.type === 'audio') {
        // For audio devices, we mainly detect them but control is through Web Audio API
        setActiveDevice(device);
        toast({
          title: "Audio Device Connected!",
          description: `Connected to ${device.name}`,
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${device.name}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Send control data to broadcast system
  const sendToBroadcast = useCallback(async (controlData: Partial<HardwareStatus>) => {
    try {
      // This would send to your backend/broadcast system
      const response = await fetch('/api/hardware-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...controlData,
          deviceId: activeDevice?.id,
          deviceName: activeDevice?.name,
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send control data');
      }
    } catch (error) {
      console.error('Failed to send to broadcast system:', error);
    }
  }, [activeDevice]);

  // Toggle live broadcasting
  const toggleLive = useCallback(() => {
    setHardwareStatus(prev => {
      const newLiveState = !prev.isLive;
      
      toast({
        title: newLiveState ? "Now Live!" : "Gone Offline",
        description: newLiveState ? "Hardware mixer is now broadcasting live" : "Hardware mixer stopped broadcasting",
      });
      
      return { ...prev, isLive: newLiveState };
    });
  }, [toast]);

  // Handle MIDI messages from hardware
  const handleMIDIMessage = useCallback((data: Uint8Array) => {
    const [command, control, value] = data;
    
    // Handle Control Change messages (CC)
    if (command === 176) {
      const normalizedValue = Math.round((value / 127) * 100);
      
      // Extended MIDI CC mapping for comprehensive DJ control
      switch (control) {
        case 1: // Crossfader
          setHardwareStatus(prev => ({ ...prev, crossfader: normalizedValue }));
          console.log(`Crossfader: ${normalizedValue}%`);
          break;
        case 7: // Master Volume
          setHardwareStatus(prev => ({ ...prev, masterVolume: normalizedValue }));
          console.log(`Master Volume: ${normalizedValue}%`);
          break;
        case 14: // Channel 1 Volume
          setHardwareStatus(prev => ({ ...prev, channel1Volume: normalizedValue }));
          console.log(`Channel 1 Volume: ${normalizedValue}%`);
          break;
        case 15: // Channel 2 Volume
          setHardwareStatus(prev => ({ ...prev, channel2Volume: normalizedValue }));
          console.log(`Channel 2 Volume: ${normalizedValue}%`);
          break;
        case 16: // Microphone Level
          setHardwareStatus(prev => ({ ...prev, micLevel: normalizedValue }));
          console.log(`Microphone Level: ${normalizedValue}%`);
          break;
        // Additional common DJ controller mappings
        case 2: // Channel 1 EQ High
        case 3: // Channel 1 EQ Mid  
        case 4: // Channel 1 EQ Low
        case 5: // Channel 2 EQ High
        case 6: // Channel 2 EQ Mid
        case 8: // Channel 2 EQ Low
          console.log(`EQ Control CC${control}: ${normalizedValue}%`);
          break;
        case 9: // Headphone Volume
        case 10: // Headphone Cue Mix
          console.log(`Headphone Control CC${control}: ${normalizedValue}%`);
          break;
        default:
          console.log(`Hardware Control CC${control}: ${normalizedValue}%`);
      }
      
      // Send all control changes to broadcast system
      sendToBroadcast({ 
        lastControlChange: { control, value: normalizedValue, timestamp: Date.now() }
      });
    }
    
    // Handle Note On/Off for buttons
    if (command === 144 || command === 128) { // Note On/Off
      const isPressed = command === 144 && value > 0;
      
      switch (control) {
        case 60: // Play button (C4)
          if (isPressed) {
            console.log('Hardware Play button pressed - Going Live!');
            toggleLive();
          }
          break;
        case 61: // Stop button (C#4)
          if (isPressed) {
            console.log('Hardware Stop button pressed');
            setHardwareStatus(prev => ({ ...prev, isLive: false }));
          }
          break;
        case 62: // Cue button (D4)
        case 63: // Sync button (D#4)
        case 64: // Loop button (E4)
          if (isPressed) {
            console.log(`Hardware button ${control} pressed`);
          }
          break;
        default:
          console.log(`Hardware button ${control} ${isPressed ? 'pressed' : 'released'}`);
      }
    }
  }, [toggleLive, sendToBroadcast]);

  // Disconnect from current device
  const disconnect = useCallback(() => {
    setActiveDevice(null);
    setHardwareStatus(prev => ({ ...prev, isLive: false }));
    toast({
      title: "Hardware Disconnected",
      description: "Hardware mixer has been disconnected",
    });
  }, [toast]);

  // Initialize on mount
  useEffect(() => {
    scanForDevices();
  }, [scanForDevices]);

  // Send hardware status to broadcast system when it changes
  useEffect(() => {
    if (activeDevice && hardwareStatus.isLive) {
      sendToBroadcast(hardwareStatus);
    }
  }, [hardwareStatus, activeDevice, sendToBroadcast]);

  return {
    devices,
    activeDevice,
    hardwareStatus,
    isScanning,
    scanForDevices,
    connectToDevice,
    disconnect,
    toggleLive,
    isConnected: !!activeDevice
  };
};