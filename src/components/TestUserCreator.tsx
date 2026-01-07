import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { testUsers, createTestUser, createAllTestUsers, confirmTestUserEmails } from "@/utils/createTestUsers";
import { Users, UserPlus, Shield, Headphones, MessageSquare, User, Mail } from "lucide-react";

const TestUserCreator = () => {
  const [creating, setCreating] = useState(false);
  const [creatingAll, setCreatingAll] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (user: typeof testUsers[0]) => {
    setCreating(true);
    const result = await createTestUser(user);
    
    if (result.success) {
      toast({
        title: "User Created & Confirmed!",
        description: `${user.displayName} (${user.email}) created and email confirmed automatically.`
      });
    } else {
      toast({
        title: "Creation Failed",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setCreating(false);
  };

  const handleCreateAllUsers = async () => {
    setCreatingAll(true);
    const results = await createAllTestUsers();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    toast({
      title: "Batch Creation Complete",
      description: `${successful} users created and confirmed, ${failed} failed.`,
      variant: successful > 0 ? "default" : "destructive"
    });
    
    setCreatingAll(false);
  };

  const handleConfirmEmails = async () => {
    setConfirming(true);
    const result = await confirmTestUserEmails();
    
    if (result.success) {
      toast({
        title: "Emails Confirmed!",
        description: "Test user emails have been confirmed successfully."
      });
    } else {
      toast({
        title: "Confirmation Failed",
        description: result.error || "Failed to confirm emails",
        variant: "destructive"
      });
    }
    
    setConfirming(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'dj': return <Headphones className="h-4 w-4" />;
      case 'presenter': return <MessageSquare className="h-4 w-4" />;
      case 'moderator': return <User className="h-4 w-4" />;
      case 'listener': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'dj': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'presenter': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'moderator': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'listener': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Test User Creator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create test users with different roles for testing PULSE FM features.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create All Button */}
        <div className="flex justify-center gap-3">
          <Button 
            onClick={handleCreateAllUsers}
            disabled={creatingAll || creating || confirming}
            className="gap-2"
            size="lg"
          >
            <UserPlus className="h-4 w-4" />
            {creatingAll ? "Creating & Confirming..." : "Create All Test Users"}
          </Button>
          
          <Button 
            onClick={handleConfirmEmails}
            disabled={creatingAll || creating || confirming}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <Mail className="h-4 w-4" />
            {confirming ? "Confirming..." : "Manual Email Confirm"}
          </Button>
        </div>

        {/* Individual Users */}
        <div className="grid gap-4 md:grid-cols-2">
          {testUsers.map((user) => (
            <Card key={user.email} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{user.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge className={`gap-1 ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {user.bio}
                </p>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>Password:</strong> {user.password}
                  </div>
                  
                  <Button
                    onClick={() => handleCreateUser(user)}
                    disabled={creating || creatingAll}
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    {creating ? "Creating & Confirming..." : "Create User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Click "Create All Test Users" to create all users at once</li>
            <li>Or create individual users using the buttons above</li>
            <li>Users will be created with the specified roles and permissions</li>
            <li>Emails are automatically confirmed during creation</li>
            <li>Use the provided credentials to test different features</li>
          </ol>
          
          <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
            <p className="text-xs text-green-600 font-medium">✅ Auto-Confirmation Enabled:</p>
            <p className="text-xs text-green-600">
              Emails are automatically confirmed during user creation - no manual confirmation needed!
            </p>
          </div>
        </div>

        {/* Role Permissions */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-foreground mb-2">Role Permissions:</h4>
          <div className="space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge className={`gap-1 ${getRoleColor('admin')}`}>
                {getRoleIcon('admin')} ADMIN
              </Badge>
              <span>Full access - DJ Dashboard, Show Management, Blog Management, Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`gap-1 ${getRoleColor('dj')}`}>
                {getRoleIcon('dj')} DJ
              </Badge>
              <span>DJ Dashboard, Create Shows, Live Broadcasting, Chat Moderation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`gap-1 ${getRoleColor('presenter')}`}>
                {getRoleIcon('presenter')} PRESENTER
              </Badge>
              <span>Create Shows, Blog Writing, Content Creation, Chat Moderation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`gap-1 ${getRoleColor('moderator')}`}>
                {getRoleIcon('moderator')} MODERATOR
              </Badge>
              <span>Chat Moderation, User Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`gap-1 ${getRoleColor('listener')}`}>
                {getRoleIcon('listener')} LISTENER
              </Badge>
              <span>Listen to Shows, Chat Participation, Favorites, Notifications</span>
            </div>
          </div>
        </div>

        {/* Backup Options */}
        <div className="bg-blue-500/10 rounded-lg p-4 text-sm border border-blue-500/20">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span>ℹ️</span> Backup Options
          </h4>
          <p className="text-muted-foreground mb-2">
            If auto-confirmation fails, you can:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs mb-3">
            <li><strong>Use "Manual Email Confirm"</strong> button above</li>
            <li><strong>Disable email confirmation</strong> in Supabase Dashboard</li>
            <li><strong>Create users manually</strong> via the auth page</li>
          </ol>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard/project/cnysfutwvxfxuvawbybb/auth/settings', '_blank')}
            >
              Open Supabase Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/auth', '_blank')}
            >
              Manual Sign Up
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestUserCreator;