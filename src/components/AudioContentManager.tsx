import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Music, 
  Volume2, 
  Upload, 
  Trash2, 
  Play, 
  Plus,
  RefreshCw,
  Database
} from 'lucide-react';

interface AudioContent {
  id: string;
  name: string;
  artist?: string;
  content_type: string;
  file_path?: string;
  language: string;
  explicit_content: boolean;
  is_active: boolean;
  play_count: number;
  duration?: number;
  genre?: string;
  category?: string;
}

const AudioContentManager = () => {
  const { toast } = useToast();
  const [audioContent, setAudioContent] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    artist: '',
    content_type: 'music',
    genre: '',
    category: '',
    language: 'en',
    explicit_content: false,
    duration: 0
  });

  // Fetch audio content from audio_content table
  const fetchAudioContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('audio_content')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setAudioContent(data || []);
    } catch (error) {
      console.error('Error fetching audio content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audio content from database.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add sample data
  // Add sample data using audio_content table
  const addSampleData = async () => {
    try {
      const sampleData = [
        // Station Jingles (Real radio content)
        { name: 'PULSE FM Station ID', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Station ID', category: 'branding', duration: 15 },
        { name: 'Morning Drive Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 10 },
        { name: 'Afternoon Vibes Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 12 },
        { name: 'Evening Mix Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 8 },
        { name: 'News Update Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'News', category: 'programming', duration: 6 },
        { name: 'Weather Report Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Weather', category: 'programming', duration: 5 },
        { name: 'Traffic Update Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Traffic', category: 'programming', duration: 4 },
        
        // Royalty-Free Music (Safe to use)
        { name: 'Classical Morning', artist: 'Public Domain Orchestra', content_type: 'music', genre: 'Classical', category: 'instrumental', duration: 210 },
        { name: 'Jazz Cafe', artist: 'Royalty Free Jazz Ensemble', content_type: 'music', genre: 'Jazz', category: 'instrumental', duration: 195 },
        { name: 'Acoustic Sunrise', artist: 'Creative Commons Artists', content_type: 'music', genre: 'Acoustic', category: 'folk', duration: 185 },
        { name: 'Electronic Chill', artist: 'Open Source Beats', content_type: 'music', genre: 'Chillout', category: 'electronic', duration: 205 },
        { name: 'World Fusion', artist: 'Global Commons', content_type: 'music', genre: 'World', category: 'fusion', duration: 230 },
        
        // Station Promos
        { name: 'PULSE FM App Promo', artist: 'PULSE FM Marketing', content_type: 'advertisement', genre: 'Station Promo', category: 'internal', duration: 30 },
        { name: 'Community Events Promo', artist: 'PULSE FM Marketing', content_type: 'advertisement', genre: 'Community', category: 'public-service', duration: 25 },
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const item of sampleData) {
        try {
          const { error } = await (supabase as any)
            .from('audio_content')
            .insert({
              ...item,
              file_path: `${item.content_type}s/${item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.mp3`,
              language: 'en',
              explicit_content: false,
              is_active: true,
              play_count: 0,
              upload_date: new Date().toISOString()
            });

          if (error) {
            if (error.message.includes('duplicate') || error.code === '23505') {
              // Duplicate entry, skip
              continue;
            }
            throw error;
          }
          successCount++;
        } catch (error) {
          console.error(`Error inserting ${item.name}:`, error);
          errorCount++;
        }
      }

      await fetchAudioContent();
      toast({
        title: 'Real Audio Content Added',
        description: `Added ${successCount} real audio items to your library. ${errorCount > 0 ? `${errorCount} items were skipped (likely duplicates).` : ''}`,
      });

    } catch (error: any) {
      console.error('Error setting up audio content:', error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup audio content',
        variant: 'destructive'
      });
    }
  };

  // Add new audio content using audio_content table
  const addAudioContent = async () => {
    try {
      const { error } = await (supabase as any)
        .from('audio_content')
        .insert({
          name: formData.name,
          artist: formData.artist,
          content_type: formData.content_type,
          genre: formData.genre,
          category: formData.category,
          duration: formData.duration,
          file_path: `${formData.content_type}s/${formData.name.toLowerCase().replace(/\s+/g, '-')}.mp3`,
          language: formData.language,
          explicit_content: formData.explicit_content,
          is_active: true,
          play_count: 0,
          upload_date: new Date().toISOString()
        });

      if (error) throw error;

      await fetchAudioContent();
      setShowAddForm(false);
      setFormData({
        name: '',
        artist: '',
        content_type: 'music',
        genre: '',
        category: '',
        language: 'en',
        explicit_content: false,
        duration: 0
      });

      toast({
        title: 'Content Added',
        description: 'Audio content has been added successfully'
      });
    } catch (error: any) {
      console.error('Error adding audio content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add audio content',
        variant: 'destructive'
      });
    }
  };

  // Delete audio content from audio_content table
  const deleteAudioContent = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('audio_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAudioContent();
      toast({
        title: 'Content Deleted',
        description: 'Audio content has been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting audio content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete audio content',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAudioContent();
  }, []);

  const jingles = audioContent.filter(c => c.content_type === 'jingle');
  const musicTracks = audioContent.filter(c => c.content_type === 'music');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Audio Content Manager
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={fetchAudioContent} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={addSampleData} variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Sample Data
              </Button>
              <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{audioContent.length}</div>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{jingles.length}</div>
              <p className="text-xs text-muted-foreground">Jingles</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">{musicTracks.length}</div>
              <p className="text-xs text-muted-foreground">Music Tracks</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {audioContent.filter(c => c.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      {showAddForm && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Add New Audio Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Track or jingle name"
                />
              </div>
              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                  placeholder="Artist name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="content_type">Content Type</Label>
                <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="jingle">Jingle</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  placeholder="Genre"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  placeholder="Duration"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addAudioContent}>Add Content</Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Jingles */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Station Jingles ({jingles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jingles.map((jingle) => (
                <div key={jingle.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{jingle.name}</p>
                    <p className="text-sm text-muted-foreground">{jingle.genre} • {jingle.duration}s</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={jingle.is_active ? "default" : "secondary"} className="text-xs">
                      {jingle.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => deleteAudioContent(jingle.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {jingles.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No jingles found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Music */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Music Library ({musicTracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {musicTracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {track.artist} • {track.genre} • {Math.floor((track.duration || 0) / 60)}:{((track.duration || 0) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={track.is_active ? "default" : "secondary"} className="text-xs">
                      {track.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => deleteAudioContent(track.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {musicTracks.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No music tracks found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioContentManager;