import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ContentType = 'music' | 'jingle' | 'advertisement' | 'news' | 'weather' | 'other';

interface AudioContent {
  id: string;
  name: string;
  file_path: string;
  file_size?: number;
  duration?: number; // seconds
  content_type: ContentType;
  category?: string;
  artist?: string;
  album?: string;
  genre?: string;
  language: string;
  explicit_content: boolean;
  upload_date: string;
  uploaded_by?: string;
  is_active: boolean;
  play_count: number;
  last_played?: string;
  metadata?: any;
}

interface PlayHistoryEntry {
  id: string;
  content_id: string;
  session_id?: string;
  played_by?: string;
  played_at: string;
  duration_played?: number;
  play_type: 'full' | 'partial' | 'skipped';
  listener_count: number;
}

interface AudioContentFilters {
  contentType?: ContentType;
  category?: string;
  genre?: string;
  artist?: string;
  language?: string;
  explicitContent?: boolean;
  isActive?: boolean;
}

export const useAudioContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [audioContent, setAudioContent] = useState<AudioContent[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<AudioContent | null>(null);

  // Fetch audio content with filters
  const fetchAudioContent = useCallback(async (filters: AudioContentFilters = {}) => {
    try {
      let query = supabase
        .from('audio_content')
        .select('*')
        .order('upload_date', { ascending: false });

      // Apply filters
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.genre) {
        query = query.eq('genre', filters.genre);
      }
      if (filters.artist) {
        query = query.ilike('artist', `%${filters.artist}%`);
      }
      if (filters.language) {
        query = query.eq('language', filters.language);
      }
      if (filters.explicitContent !== undefined) {
        query = query.eq('explicit_content', filters.explicitContent);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAudioContent(data || []);
    } catch (error) {
      console.error('Error fetching audio content:', error);
      toast({
        title: 'Failed to Load Audio Content',
        description: 'Could not load audio content from the server.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Upload audio content (admin only)
  const uploadAudioContent = async (
    file: File,
    metadata: {
      name: string;
      content_type: ContentType;
      category?: string;
      artist?: string;
      album?: string;
      genre?: string;
      language?: string;
      explicit_content?: boolean;
    }
  ) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upload audio content.',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `audio-content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get file duration (if possible)
      let duration: number | undefined;
      try {
        duration = await getAudioDuration(file);
      } catch (error) {
        console.warn('Could not get audio duration:', error);
      }

      // Create database record
      const { data, error } = await supabase
        .from('audio_content')
        .insert({
          name: metadata.name,
          file_path: filePath,
          file_size: file.size,
          duration,
          content_type: metadata.content_type,
          category: metadata.category,
          artist: metadata.artist,
          album: metadata.album,
          genre: metadata.genre,
          language: metadata.language || 'en',
          explicit_content: metadata.explicit_content || false,
          uploaded_by: user.id,
          is_active: true,
          play_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAudioContent(prev => [data, ...prev]);

      toast({
        title: 'Upload Successful',
        description: `"${metadata.name}" has been uploaded successfully.`,
      });

      return data;
    } catch (error: any) {
      console.error('Error uploading audio content:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload audio content.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Play audio content
  const playAudioContent = async (
    content: AudioContent,
    sessionId?: string,
    listenerCount: number = 0
  ) => {
    try {
      setCurrentlyPlaying(content);

      // Log play history
      const { error } = await supabase
        .from('play_history')
        .insert({
          content_id: content.id,
          session_id: sessionId,
          played_by: user?.id,
          played_at: new Date().toISOString(),
          play_type: 'full',
          listener_count: listenerCount,
        });

      if (error) {
        console.error('Error logging play history:', error);
      }

      toast({
        title: 'Now Playing',
        description: `${content.name}${content.artist ? ` by ${content.artist}` : ''}`,
      });

      return true;
    } catch (error) {
      console.error('Error playing audio content:', error);
      toast({
        title: 'Playback Failed',
        description: 'Could not start playing the selected content.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Stop audio content
  const stopAudioContent = () => {
    setCurrentlyPlaying(null);
  };

  // Update audio content metadata
  const updateAudioContent = async (
    contentId: string,
    updates: Partial<AudioContent>
  ) => {
    try {
      const { data, error } = await supabase
        .from('audio_content')
        .update(updates)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAudioContent(prev =>
        prev.map(item => (item.id === contentId ? { ...item, ...data } : item))
      );

      toast({
        title: 'Content Updated',
        description: 'Audio content has been updated successfully.',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating audio content:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update audio content.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete audio content
  const deleteAudioContent = async (contentId: string) => {
    try {
      // Get content info first
      const content = audioContent.find(c => c.id === contentId);
      if (!content) return false;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('audio-files')
        .remove([content.file_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('audio_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Update local state
      setAudioContent(prev => prev.filter(item => item.id !== contentId));

      toast({
        title: 'Content Deleted',
        description: 'Audio content has been deleted successfully.',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting audio content:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete audio content.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get play history
  const fetchPlayHistory = useCallback(async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('play_history')
        .select(`
          *,
          audio_content:content_id (
            name,
            artist,
            content_type
          )
        `)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setPlayHistory(data || []);
    } catch (error) {
      console.error('Error fetching play history:', error);
    }
  }, []);

  // Get content statistics
  const getContentStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('audio_content')
        .select('content_type, play_count')
        .eq('is_active', true);

      if (error) throw error;

      // Calculate stats
      const stats = {
        totalTracks: data?.length || 0,
        totalPlays: data?.reduce((sum, item) => sum + item.play_count, 0) || 0,
        byType: data?.reduce((acc, item) => {
          acc[item.content_type] = (acc[item.content_type] || 0) + 1;
          return acc;
        }, {} as Record<ContentType, number>) || {},
      };

      return stats;
    } catch (error) {
      console.error('Error getting content stats:', error);
      return null;
    }
  }, []);

  // Helper function to get audio duration
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = reject;
      audio.src = URL.createObjectURL(file);
    });
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchAudioContent({ isActive: true });
      await fetchPlayHistory(20);
      setLoading(false);
    };

    initialize();
  }, [fetchAudioContent, fetchPlayHistory]);

  // Subscribe to audio content changes
  useEffect(() => {
    const channel = supabase
      .channel('audio_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_content'
        },
        () => {
          fetchAudioContent({ isActive: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAudioContent]);

  return {
    // State
    audioContent,
    playHistory,
    loading,
    uploading,
    currentlyPlaying,
    
    // Actions
    fetchAudioContent,
    uploadAudioContent,
    playAudioContent,
    stopAudioContent,
    updateAudioContent,
    deleteAudioContent,
    fetchPlayHistory,
    getContentStats,
    
    // Computed
    musicTracks: audioContent.filter(c => c.content_type === 'music'),
    jingles: audioContent.filter(c => c.content_type === 'jingle'),
    advertisements: audioContent.filter(c => c.content_type === 'advertisement'),
  };
};