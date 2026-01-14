import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Trash2, Mail, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string; // Using string instead of strict enum for flexibility
  user?: User;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserRole, setNewUserRole] = useState("listener");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
      if (rolesData && rolesData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(rolesData.map(role => role.user_id))];
        
        // Get profiles for these users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        
        // Get auth users for email addresses
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        
        // Combine the data
        const rolesWithUsers = rolesData.map(role => {
          const profile = profiles?.find(p => p.user_id === role.user_id);
          const authUser = authUsers.users?.find(u => u.id === role.user_id);
          
          return {
            ...role,
            user: {
              id: role.user_id,
              email: authUser?.email || `user-${role.user_id.slice(0, 8)}@example.com`,
              display_name: profile?.display_name || authUser?.user_metadata?.display_name || 'Unknown User',
              created_at: authUser?.created_at || new Date().toISOString()
            }
          };
        });
        
        setUserRoles(rolesWithUsers);
      } else {
        setUserRoles([]);
      }
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserDisplayName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
      
      // Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: newUserDisplayName
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            display_name: newUserDisplayName
          });

        if (profileError) console.warn('Profile creation failed:', profileError);

        // Assign role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: newUserRole as any // Temporary fix until enum is updated
          });

        if (roleError) console.warn('Role assignment failed:', roleError);

        toast({
          title: "User Created Successfully!",
          description: `User ${newUserEmail} created with role ${newUserRole}. Temporary password: ${tempPassword}`,
        });

        // Refresh data and reset form
        await fetchUserRoles();
        setNewUserEmail("");
        setNewUserDisplayName("");
        setNewUserRole("listener");
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Make sure you have admin privileges.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role as any // Temporary fix until enum is updated
        });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User has been assigned the ${role} role.`,
      });

      await fetchUserRoles();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any); // Temporary fix until enum is updated

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `${role} role has been removed from user.`,
      });

      await fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'dj': return 'default';
      case 'presenter': return 'secondary';
      case 'moderator': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading user management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create New User */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="userDisplayName">Display Name</Label>
                <Input
                  id="userDisplayName"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="userRole">Initial Role</Label>
                <select
                  id="userRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                >
                  <option value="listener">Listener</option>
                  <option value="moderator">Moderator</option>
                  <option value="presenter">Presenter</option>
                  <option value="dj">DJ</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating User..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Statistics
              <Badge variant="secondary" className="ml-2">
                {userRoles.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {['admin', 'dj', 'presenter', 'moderator', 'listener'].map(role => {
                  const count = userRoles.filter(ur => ur.role === role).length;
                  return (
                    <div key={role} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="capitalize font-medium">{role}s</span>
                      <Badge variant={getRoleBadgeVariant(role)}>{count}</Badge>
                    </div>
                  );
                })}
              </div>
              
              {userRoles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No users found</p>
                  <p className="text-xs mt-1">Create your first user above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      {userRoles.length > 0 && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userRoles.map((userRole) => (
                <div
                  key={`${userRole.user_id}-${userRole.role}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {userRole.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">
                        {userRole.user?.display_name || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{userRole.user?.email || 'No email'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Role Management */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Current Role Badge */}
                    <Badge variant={getRoleBadgeVariant(userRole.role)} className="capitalize">
                      {userRole.role}
                    </Badge>
                    
                    {/* Role Change Dropdown */}
                    <select
                      value={userRole.role}
                      onChange={(e) => handleAssignRole(userRole.user_id, e.target.value)}
                      className="text-xs px-2 py-1 rounded bg-background border border-border hover:border-primary transition-colors min-w-[100px]"
                    >
                      <option value="listener">Listener</option>
                      <option value="moderator">Moderator</option>
                      <option value="presenter">Presenter</option>
                      <option value="dj">DJ</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    {/* Remove Role Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRole(userRole.user_id, userRole.role)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Remove this role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;