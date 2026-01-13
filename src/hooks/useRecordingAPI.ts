import { useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Recording {
  id: number;
  supabase_session_id: string;
  dj_name: string;
  show_title: string;
  filename: string;
  file_size: number;
  file_size_mb: number;
  duration_seconds: number;
  duration_formatted: string;
  recorded_at: string;
  download_count: number;
  download_url: string;
  is_public?: boolean;
}

interface UploadResponse {
  success: boolean;
  recording_id?: number;
  filename?: string;
  file_size?: number;
  duration?: number;
  message?: string;
  error?: string;
}

interface ListResponse {
  success: boolean;
  recordings?: Recording[];
  count?: number;
  error?: string;
}

export const useRecordingAPI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get API base URL
  const getApiUrl = () => {
    // Check if we're in development mode
    if (import.meta.env.DEV) {
      // Local development - use PHP server
      return 'http://localhost:8080/api/recording_api.php';
    } else {
      // Production - use current domain
      return `${window.location.origin}/api/recording_api.php`;
    }
  };

  // Get user token for authentication
  const getUserToken = async () => {
    if (!user) return null;
    
    try {
      // Get fresh token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  };

  // Upload recording
  const uploadRecording = async (
    audioBlob: Blob,
    sessionId: string,
    djName: string,
    showTitle: string
  ): Promise<UploadResponse> => {
    setUploading(true);
    
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('audio', audioBlob, `${showTitle}_${Date.now()}.mp3`);
      formData.append('session_id', sessionId);
      formData.append('dj_name', djName);
      formData.append('show_title', showTitle);
      formData.append('token', token);

      const response = await fetch(getApiUrl(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UploadResponse = await response.json();

      if (result.success) {
        toast({
          title: "Recording Saved!",
          description: `"${showTitle}" has been saved successfully.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload recording';
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  };

  // List recordings
  const listRecordings = async (publicOnly: boolean = false): Promise<Recording[]> => {
    setLoading(true);
    
    try {
      const token = publicOnly ? '' : await getUserToken();
      const url = new URL(getApiUrl());
      url.searchParams.append('action', 'list');
      
      if (token) {
        url.searchParams.append('token', token);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ListResponse = await response.json();

      if (result.success) {
        return result.recordings || [];
      } else {
        throw new Error(result.error || 'Failed to fetch recordings');
      }
    } catch (error: any) {
      console.error('Error fetching recordings:', error);
      
      toast({
        title: "Failed to Load Recordings",
        description: error.message || 'Could not fetch recordings',
        variant: "destructive",
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  // Delete recording
  const deleteRecording = async (recordingId: number): Promise<boolean> => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('id', recordingId.toString());
      formData.append('token', token);

      const response = await fetch(getApiUrl(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Recording Deleted",
          description: "Recording has been deleted successfully.",
        });
        return true;
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || 'Failed to delete recording',
        variant: "destructive",
      });
      return false;
    }
  };

  // Get download URL with authentication
  const getDownloadUrl = async (recordingId: number): Promise<string | null> => {
    try {
      const token = await getUserToken();
      const url = new URL(getApiUrl());
      url.searchParams.append('action', 'download');
      url.searchParams.append('id', recordingId.toString());
      
      if (token) {
        url.searchParams.append('token', token);
      }

      return url.toString();
    } catch (error) {
      console.error('Error generating download URL:', error);
      return null;
    }
  };

  // Download recording
  const downloadRecording = async (recording: Recording) => {
    try {
      const downloadUrl = await getDownloadUrl(recording.id);
      if (!downloadUrl) {
        throw new Error('Could not generate download URL');
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${recording.show_title}_${recording.dj_name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading "${recording.show_title}"`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || 'Failed to download recording',
        variant: "destructive",
      });
    }
  };

  return {
    // State
    uploading,
    loading,
    
    // Actions
    uploadRecording,
    listRecordings,
    deleteRecording,
    downloadRecording,
    getDownloadUrl,
  };
};