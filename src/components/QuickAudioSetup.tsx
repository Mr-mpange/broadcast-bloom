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

  // Real audio content for radio station (remove test data)
  const setupAudioContent = async () => {
    setLoading(true);
    try {
      // Check if content already exists
      const { data: existingContent, error: checkError } = await (supabase as any)
        .from('audio_content')
        .select('id')
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingContent && existingContent.length > 0) {
        toast({
          title: 'Audio Library Ready',
          description: 'Your audio content library is already set up and ready for broadcasting.',
        });
        setSetupComplete(true);
        setLoading(false);
        return;
      }

      // If no content exists, show message that content needs to be uploaded
      toast({
        title: 'Audio Library Empty',
        description: 'Upload your station jingles, music, and content through the Audio Content Manager.',
        variant: 'default',
      });
      
      setSetupComplete(false);
    } catch (error: any) {
      console.error('Error checking audio content:', error);
      toast({
        title: 'Setup Check Failed',
        description: error.message || 'Failed to check audio content status',
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
                Your audio library is empty. Upload your station's jingles, music, and promotional content to get started.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To set up your radio station's audio library:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Go to the Audio Content Manager</li>
                <li>• Upload your station jingles and IDs</li>
                <li>• Add your music library</li>
                <li>• Upload promotional content and advertisements</li>
                <li>• All content will be available for live broadcasting</li>
              </ul>
            </div>

            <Button 
              onClick={setupAudioContent} 
              disabled={loading}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? 'Checking...' : 'Check Audio Library Status'}
            </Button>
          </>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your audio library is ready for broadcasting! Upload additional content through the Audio Content Manager.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickAudioSetup;