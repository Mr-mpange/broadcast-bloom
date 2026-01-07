import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <Card className="fixed top-20 left-4 right-4 z-50 glass-panel border-destructive/20 md:left-auto md:right-4 md:w-96">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
            <WifiOff className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">You're Offline</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Some features may not be available. Check your internet connection.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} size="sm" variant="outline" className="gap-2">
                <RefreshCw size={14} />
                Retry
              </Button>
              <Button 
                onClick={() => setShowOfflineMessage(false)} 
                size="sm" 
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineIndicator;