import { useState, useEffect } from 'react';
import { useLiveShows } from './useLiveShows';

export const useGlobalLiveStatus = () => {
  const { liveShows } = useLiveShows();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if any shows are currently live
    const hasLiveShows = Array.isArray(liveShows) && liveShows.length > 0;
    setIsLive(hasLiveShows);
  }, [liveShows]);

  return {
    isLive,
    liveShowCount: Array.isArray(liveShows) ? liveShows.length : 0,
    liveShows
  };
};