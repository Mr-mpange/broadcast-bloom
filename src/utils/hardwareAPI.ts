// Hardware Mixer API utilities
// This simulates the backend API for hardware control

export interface HardwareControlData {
  control: string;
  value: number;
  timestamp: number;
  mixerModel?: string;
  connectionType?: string;
}

export interface LiveBroadcastData {
  isLive: boolean;
  mixerModel?: string;
  hardwareStatus: any;
}

// Simulate hardware control API
export const sendHardwareControl = async (data: HardwareControlData): Promise<boolean> => {
  try {
    // In a real implementation, this would send to your backend
    console.log('Hardware Control:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Store in localStorage for demo purposes
    const controls = JSON.parse(localStorage.getItem('hardwareControls') || '[]');
    controls.push(data);
    localStorage.setItem('hardwareControls', JSON.stringify(controls.slice(-50))); // Keep last 50
    
    return true;
  } catch (error) {
    console.error('Failed to send hardware control:', error);
    return false;
  }
};

// Simulate live broadcast API
export const toggleLiveBroadcast = async (data: LiveBroadcastData): Promise<boolean> => {
  try {
    console.log('Live Broadcast Toggle:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Store broadcast state
    localStorage.setItem('broadcastState', JSON.stringify(data));
    
    // Simulate broadcasting to streaming server
    if (data.isLive) {
      console.log('🔴 LIVE: Hardware mixer connected to broadcast stream');
    } else {
      console.log('⚫ OFFLINE: Hardware mixer disconnected from broadcast stream');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to toggle live broadcast:', error);
    return false;
  }
};

// Get current broadcast state
export const getBroadcastState = (): LiveBroadcastData | null => {
  try {
    const state = localStorage.getItem('broadcastState');
    return state ? JSON.parse(state) : null;
  } catch {
    return null;
  }
};

// Get hardware control history
export const getHardwareControlHistory = (): HardwareControlData[] => {
  try {
    return JSON.parse(localStorage.getItem('hardwareControls') || '[]');
  } catch {
    return [];
  }
};

// Simulate real-time hardware monitoring
export const startHardwareMonitoring = (callback: (data: HardwareControlData) => void) => {
  // In a real implementation, this would connect to WebSocket or SSE
  const interval = setInterval(() => {
    // Simulate random hardware changes (for demo)
    if (Math.random() > 0.95) { // 5% chance every second
      const controls = ['crossfader', 'masterVolume', 'channel1Volume', 'channel2Volume'];
      const control = controls[Math.floor(Math.random() * controls.length)];
      const value = Math.floor(Math.random() * 100);
      
      callback({
        control,
        value,
        timestamp: Date.now(),
        mixerModel: 'Demo Hardware',
        connectionType: 'midi'
      });
    }
  }, 1000);
  
  return () => clearInterval(interval);
};

// Hardware device detection simulation
export const detectHardwareDevices = async (): Promise<Array<{id: string, name: string, type: string}>> => {
  // Simulate device detection delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock devices for demo
  return [
    { id: 'pioneer-ddj-400', name: 'Pioneer DDJ-400', type: 'midi' },
    { id: 'numark-party-mix', name: 'Numark Party Mix', type: 'midi' },
    { id: 'behringer-djx750', name: 'Behringer DJX750', type: 'audio' },
  ];
};