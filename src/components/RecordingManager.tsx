import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecordingAPI } from "@/hooks/useRecordingAPI";
import { useAuth } from "@/hooks/useAuth";
import { 
  Download, 
  Trash2, 
  Play, 
  Clock, 
  User, 
  Calendar,
  HardDrive,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface RecordingManagerProps {
  showPublicOnly?: boolean;
}

const RecordingManager = ({ showPublicOnly = false }: RecordingManagerProps) => {
  const { user } = useAuth();
  const { listRecordings, deleteRecording, downloadRecording, loading } = useRecordingAPI();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Load recordings
  const loadRecordings = async () => {
    const data = await listRecordings(showPublicOnly);
    setRecordings(data);
  };

  // Load recordings on component mount
  useEffect(() => {
    loadRecordings();
  }, [showPublicOnly]);

  // Handle delete recording
  const handleDelete = async (recordingId: number) => {
    setDeleting(recordingId);
    const success = await deleteRecording(recordingId);
    
    if (success) {
      // Remove from local state
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
    }
    
    setDeleting(null);
  };

  // Handle download
  const handleDownload = async (recording: Recording) => {
    await downloadRecording(recording);
    
    // Update download count locally
    setRecordings(prev => 
      prev.map(r => 
        r.id === recording.id 
          ? { ...r, download_count: r.download_count + 1 }
          : r
      )
    );
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Play className="h-5 w-5 text-primary" />
            {showPublicOnly ? 'Public Recordings' : 'My Recordings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading recordings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Play className="h-5 w-5 text-primary" />
            {showPublicOnly ? 'Public Recordings' : 'My Recordings'}
            <Badge variant="secondary">{recordings.length}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecordings}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No recordings found</p>
            <p className="text-sm">
              {showPublicOnly 
                ? "No public recordings available yet" 
                : "Start broadcasting to create your first recording"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Recording Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground truncate">
                        {recording.show_title}
                      </h4>
                      {recording.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {recording.dj_name}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recording.duration_formatted}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(recording.file_size)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(recording.recorded_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {recording.download_count > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {recording.download_count} downloads
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(recording)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    {!showPublicOnly && user && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recording.id)}
                        disabled={deleting === recording.id}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === recording.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordingManager;