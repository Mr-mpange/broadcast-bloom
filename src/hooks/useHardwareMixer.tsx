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

  // Scan for hardware devices with better filtering to avoid conflicts
  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    const foundDevices: MixerDevice[] = [];

    try {
      // Scan for MIDI devices with more specific filtering
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        const inputs = Array.from(midiAccess.inputs.values());
        
        inputs.forEach((input: any) => {
          // More specific filtering to avoid Serato conflicts
          const deviceName = input.name.toLowerCase();
          const isValidMixer = (
            (deviceName.includes('dj') && !deviceName.includes('serato')) ||
            (deviceName.includes('mixer') && !deviceName.includes('serato')) ||
            deviceName.includes('pioneer') ||
            deviceName.includes('numark') ||
            deviceName.includes('denon') ||
            deviceName.includes('behringer')
          ) && !deviceName.includes('virtual'); // Avoid virtual MIDI devices

          if (input.name && isValidMixer) {
            foundDevices.push({
              id: input.id,
              name: input.name,
              type: 'midi',
              connected: input.state === 'connected'
            });
          }
        });
      }

      // Scan for Audio devices with better filtering
      if (navigator.mediaDevices) {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = mediaDevices.filter(device => device.kind === 'audioinput');
        
        audioInputs.forEach(device => {
          const deviceLabel = device.label.toLowerCase();
          const isValidAudioMixer = (
            deviceLabel.includes('mixer') ||
            deviceLabel.includes('pioneer') ||
            deviceLabel.includes('behringer') ||
            deviceLabel.includes('focusrite') ||
            deviceLabel.includes('scarlett') ||
            deviceLabel.includes('audio interface')
          ) && !deviceLabel.includes('serato'); // Avoid Serato audio devices

          if (device.label && isValidAudioMixer) {
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
      
      // Don't auto-connect to avoid conflicts with Serato
      // Let user manually choose which device to connect to

    } catch (error) {
      console.error('Device scan failed:', error);
      toast({
        title: "Hardware Scan Failed",
        description: "Could not scan for hardware devices. Make sure your mixer is connected and not being used by other software like Serato DJ Pro.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  // Connect to a specific device with conflict prevention
  const connectToDevice = useCallback(async (device: MixerDevice) => {
    try {
      if (device.type === 'midi') {
        const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        const midiInput = midiAccess.inputs.get(device.id);
        
        if (midiInput) {
          // Check if device is already in use (basic check)
          if (midiInput.state !== 'connected') {
            throw new Error('MIDI device is not available or in use by another application');
          }

          // Set up MIDI message listener with error handling
          midiInput.onmidimessage = (message: any) => {
            try {
              handleMIDIMessage(message.data);
            } catch (error) {
              console.error('MIDI message handling error:', error);
            }
          };
          
          // Handle MIDI errors
          midiInput.onstatechange = (event: any) => {
            if (event.port.state === 'disconnected') {
              toast({
                title: "Hardware Disconnected",
                description: `${device.name} was disconnected. This may happen if Serato DJ Pro or another application takes control.`,
                variant: "destructive",
              });
              setActiveDevice(null);
            }
          };
          
          setActiveDevice(device);
          toast({
            title: "Hardware Connected!",
            description: `Connected to ${device.name}. If Serato DJ Pro freezes, disconnect this device first.`,
          });
        }
      } else if (device.type === 'audio') {
        // For audio devices, we mainly detect them but control is through Web Audio API
        setActiveDevice(device);
        toast({
          title: "Audio Device Connected!",
          description: `Connected to ${device.name}. Audio routing is handled separately from MIDI control.`,
        });
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${device.name}. Make sure it's not being used by Serato DJ Pro or other software.`,
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