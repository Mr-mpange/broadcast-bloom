import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecordingManager from "@/components/RecordingManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Users, Lock } from "lucide-react";

const RecordingsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Radio Recordings</h1>
        <p className="text-muted-foreground">
          Listen to past shows and manage your recordings
        </p>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public" className="gap-2">
            <Users className="h-4 w-4" />
            Public Recordings
          </TabsTrigger>
          <TabsTrigger value="my-recordings" className="gap-2">
            <Lock className="h-4 w-4" />
            My Recordings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="public" className="space-y-4">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Play className="h-5 w-5 text-primary" />
                Public Radio Shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Discover and listen to public radio shows from our DJs and presenters.
              </p>
            </CardContent>
          </Card>
          
          <RecordingManager showPublicOnly={true} />
        </TabsContent>
        
        <TabsContent value="my-recordings" className="space-y-4">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Lock className="h-5 w-5 text-primary" />
                Your Recordings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage your personal recordings. You can download, share, or delete your shows.
              </p>
            </CardContent>
          </Card>
          
          <RecordingManager showPublicOnly={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecordingsPage;