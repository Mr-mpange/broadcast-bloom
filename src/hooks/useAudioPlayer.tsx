import { useState, useRef, useEffect } from 'react';
import { getStreamUrl } from '@/config/streams';

interface UseAudioPlayerProps {
  streamUrl?: string;
  quality?: 'high' | 'medium' | 'low';
}

export const useAudioPlayer = ({ streamUrl, quality = 'medium' }: UseAudioPlayerProps = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get stream URL from config or use provided URL
  const currentStreamUrl = streamUrl || getStreamUrl(quality);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    audioRef.current.crossOrigin = 'anonymous';
    
    const audio = audioRef.current;

    // Event listeners
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Failed to load audio stream');
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const play = async () => {
    if (!audioRef.current) return;

    try {
      setError(null);
      setIsLoading(true);
      
      // Set the stream URL
      audioRef.current.src = currentStreamUrl;
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to start playback');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  return {
    isPlaying,
    isLoading,
    volume,
    isMuted,
    error,
    play,
    pause,
    togglePlay,
    toggleMute,
    setVolume: setVolumeLevel,
  };
};