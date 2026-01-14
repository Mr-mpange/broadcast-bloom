import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBroadcastControl } from "@/hooks/useBroadcastControl";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import UserManagement from "@/components/UserManagement";
import { Shield, Users } from "lucide-react";

const UserManagementPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: broadcastLoading } = useBroadcastControl();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!broadcastLoading && !permissions.canEmergencyOverride) {
      toast({
        title: "Access Denied",
        description: "You need Admin privileges to access user management.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [broadcastLoading, permissions, navigate, toast]);

  if (authLoading || broadcastLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading user management...</div>
      </div>
    );
  }

  if (!permissions.canEmergencyOverride) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            User Management
          </h1>
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            Create and manage user accounts, assign roles, and control access permissions.
          </p>
        </div>

        <UserManagement />
      </main>
    </div>
  );
};

export default UserManagementPage;