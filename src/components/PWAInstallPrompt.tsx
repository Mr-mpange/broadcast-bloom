import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to not be intrusive
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // iOS install instructions
  if (isIOS && showPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 glass-panel border-primary/20 md:left-auto md:right-4 md:w-96">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Install PULSE FM</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-6 w-6">
              <X size={14} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Add PULSE FM to your home screen for the best listening experience!
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. Tap the Share button in Safari</p>
            <p>2. Select "Add to Home Screen"</p>
            <p>3. Tap "Add" to install</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 glass-panel border-primary/20 md:left-auto md:right-4 md:w-96">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Install PULSE FM</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-6 w-6">
              <X size={14} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Install PULSE FM for offline access, push notifications, and a native app experience.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1 gap-2">
              <Download size={16} />
              Install App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PWAInstallPrompt;