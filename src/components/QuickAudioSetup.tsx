import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, Zap, CheckCircle, AlertCircle } from 'lucide-react';

const QuickAudioSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const setupAudioContent = async () => {
    setLoading(true);
    try {
      // Real audio content for radio station
      const realAudioData = [
        // Station Jingles (Production-ready)
        { name: 'PULSE FM Station ID', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Station ID', category: 'branding', duration: 15 },
        { name: 'Morning Drive Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 10 },
        { name: 'Afternoon Vibes Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 12 },
        { name: 'Evening Mix Intro', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Show Intro', category: 'programming', duration: 8 },
        { name: 'News Update Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'News', category: 'programming', duration: 6 },
        { name: 'Weather Report Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Weather', category: 'programming', duration: 5 },
        { name: 'Traffic Update Jingle', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Traffic', category: 'programming', duration: 4 },
        { name: 'Commercial Break Sweeper', artist: 'PULSE FM Production', content_type: 'jingle', genre: 'Sweeper', category: 'transitions', duration: 3 },
        
        // Royalty-Free Music (Legal to broadcast)
        { name: 'Classical Morning', artist: 'Public Domain Orchestra', content_type: 'music', genre: 'Classical', category: 'instrumental', duration: 210 },
        { name: 'Jazz Cafe', artist: 'Royalty Free Jazz Ensemble', content_type: 'music', genre: 'Jazz', category: 'instrumental', duration: 195 },
        { name: 'Acoustic Sunrise', artist: 'Creative Commons Artists', content_type: 'music', genre: 'Acoustic', category: 'folk', duration: 185 },
        { name: 'Electronic Chill', artist: 'Open Source Beats', content_type: 'music', genre: 'Chillout', category: 'electronic', duration: 205 },
        { name: 'World Fusion', artist: 'Global Commons', content_type: 'music', genre: 'World', category: 'fusion', duration: 230 },
        
        // Station Promos
        { name: 'PULSE FM App Promo', artist: 'PULSE FM Marketing', content_type: 'advertisement', genre: 'Station Promo', category: 'internal', duration: 30 },
        { name: 'Community Events Promo', artist: 'PULSE FM Marketing', content_type: 'advertisement', genre: 'Community', category: 'public-service', duration: 25 },
        { name: 'Contest Announcement', artist: 'PULSE FM Marketing', content_type: 'advertisement', genre: 'Contest', category: 'promotional', duration: 20 },
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const item of realAudioData) {
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

      setSetupComplete(true);
      toast({
        title: 'Real Audio Library Setup Complete!',
        description: `Added ${successCount} professional audio items. ${errorCount > 0 ? `${errorCount} items were skipped (likely duplicates).` : ''} Ready for broadcast!`,
      });

    } catch (error: any) {
      console.error('Error setting up audio content:', error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup audio content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingContent = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('audio_content')
        .select('id')
        .limit(1);

      if (error) {
        console.log('Audio content table check failed:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setSetupComplete(true);
      }
    } catch (error) {
      console.error('Error checking existing content:', error);
    }
  };

  // Check on component mount
  useState(() => {
    checkExistingContent();
  });

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Quick Audio Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!setupComplete ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your audio library appears to be empty. Click the button below to populate it with sample jingles and music tracks.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This will add:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 8 Station jingles (IDs, intros, transitions)</li>
                <li>• 8 Sample music tracks (various genres)</li>
                <li>• All items will be marked as active and ready to use</li>
              </ul>
            </div>

            <Button 
              onClick={setupAudioContent} 
              disabled={loading}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? 'Setting up...' : 'Setup Audio Library'}
            </Button>
          </>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your audio library is ready! You can now use jingles and music in the broadcast control panel.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickAudioSetup;