import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ShowsDebug = () => {
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllShows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shows:', error);
      } else {
        console.log('All shows in database:', data);
        setShows(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSampleShow = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .insert({
          name: 'Sample Show ' + Date.now(),
          description: 'This is a sample show created for testing',
          genre: 'Test',
          is_active: true,
          is_featured: true,
          image_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop'
        })
        .select();

      if (error) {
        console.error('Error adding show:', error);
      } else {
        console.log('Added show:', data);
        fetchAllShows(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchAllShows();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Shows Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchAllShows} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Shows'}
            </Button>
            <Button onClick={addSampleShow} variant="outline">
              Add Sample Show
            </Button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Shows in Database ({shows.length}):</h3>
            {shows.length === 0 ? (
              <p className="text-muted-foreground">No shows found in database</p>
            ) : (
              <div className="space-y-2">
                {shows.map((show) => (
                  <div key={show.id} className="p-2 border rounded text-sm">
                    <div><strong>Name:</strong> {show.name}</div>
                    <div><strong>Active:</strong> {show.is_active ? 'Yes' : 'No'}</div>
                    <div><strong>Featured:</strong> {show.is_featured ? 'Yes' : 'No'}</div>
                    <div><strong>Genre:</strong> {show.genre || 'None'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShowsDebug;