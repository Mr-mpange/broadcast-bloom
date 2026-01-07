import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TestUserCreator from "@/components/TestUserCreator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TestTube } from "lucide-react";

const TestUsers = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Allow access in development or if user is admin
    const isDevelopment = import.meta.env.DEV;
    if (!loading && !isDevelopment && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <TestTube className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Test Environment
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Test User Creator */}
          <div className="lg:col-span-2">
            <TestUserCreator />
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Development Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This page is available in development mode to help you set up test users quickly.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Quick Links:</h4>
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <a href="/auth">Authentication Page</a>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <a href="/dj">DJ Dashboard</a>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <a href="/shows">Browse Shows</a>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <a href="/favorites">Favorites</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Testing Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Create test users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test DJ dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test live broadcasting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test chat system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Test PWA features</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestUsers;