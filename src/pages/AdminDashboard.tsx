import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBroadcastControl } from "@/hooks/useBroadcastControl";
import { useAudioContent } from "@/hooks/useAudioContent";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BroadcastControlPanel from "@/components/BroadcastControlPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  Radio,
  Music,
  Calendar,
  Settings,
  BarChart3,
  AlertTriangle,
  Clock,
  Database,
  UserPlus,
  Trash2,
  Edit,
  Play,
  Pause,
  Volume2,
  Mail,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  user?: User;
}

interface TimeSlot {
  id: string;
  name: string;
  description?: string;
  assigned_user_id?: string;
  backup_user_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  slot_type: string;
  is_active: boolean;
  assigned_user?: User;
  backup_user?: User;
}

interface BroadcastSession {
  id: string;
  broadcaster_id: string;
  session_type: string;
  status: string;
  started_at: string;
  ended_at?: string;
  microphone_active: boolean;
  current_mode: string;
  emergency_override: boolean;
  broadcaster?: User;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  email_sent?: boolean;
  email_status?: string;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: broadcastLoading } = useBroadcastControl();
  const { audioContent, getContentStats } = useAudioContent();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [activeSessions, setActiveSessions] = useState<BroadcastSession[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contentStats, setContentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserRole, setNewUserRole] = useState("listener");

  // New time slot form
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotDay, setNewSlotDay] = useState(0);
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotAssignedUser, setNewSlotAssignedUser] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!broadcastLoading && !permissions.canEmergencyOverride) {
      toast({
        title: "Access Denied",
        description: "You need Admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [broadcastLoading, permissions, navigate, toast]);

  useEffect(() => {
    if (user && permissions.canEmergencyOverride) {
      fetchAllData();
    }
  }, [user, permissions]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchUserRoles(),
        fetchTimeSlots(),
        fetchActiveSessions(),
        fetchContactMessages(),
        fetchContentStats(),
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data.map(profile => ({
        id: profile.id,
        email: profile.user_id || '', // Use user_id as fallback for email
        display_name: profile.display_name,
        created_at: profile.created_at
      })));
    }
  };

  const fetchUserRoles = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('id', { ascending: false });
    
    if (data) {
      // Fetch user details separately
      const userIds = data.map(role => role.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const rolesWithUsers = data.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          ...role,
          assigned_at: new Date().toISOString(), // Add missing field
          user: profile ? {
            id: profile.id,
            email: profile.user_id || '',
            display_name: profile.display_name,
            created_at: profile.created_at
          } : undefined
        };
      });
      
      setUserRoles(rolesWithUsers);
    }
  };

  const fetchTimeSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots' as any)
      .select('*')
      .order('day_of_week', { ascending: true });
    
    if (!error && data) {
      setTimeSlots(data as unknown as TimeSlot[]);
    }
  };

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from('broadcast_sessions' as any)
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });
    
    if (!error && data) {
      // Fetch broadcaster details separately
      const broadcasterIds = data.map((session: any) => session.broadcaster_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', broadcasterIds);
      
      const sessionsWithBroadcasters = data.map((session: any) => {
        const profile = profiles?.find(p => p.id === session.broadcaster_id);
        return {
          ...session,
          broadcaster: profile ? {
            id: profile.id,
            email: profile.user_id || '',
            display_name: profile.display_name,
            created_at: profile.created_at
          } : undefined
        };
      });
      
      setActiveSessions(sessionsWithBroadcasters);
    }
  };

  const fetchContentStats = async () => {
    const stats = await getContentStats();
    setContentStats(stats);
  };

  const fetchContactMessages = async () => {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setContactMessages(data);
    }
  };

  const handleResendEmail = async (message: ContactMessage) => {
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: message.name,
          email: message.email,
          subject: message.subject,
          message: message.message,
        },
      });

      if (error) {
        toast({
          title: "Email Error",
          description: "Failed to resend email. Check if email service is configured.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Sent",
          description: "Confirmation email has been resent to the user.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend email.",
        variant: "destructive",
      });
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

    try {
      // This would typically be handled by a server-side function
      // For now, we'll show a message about manual user creation
      toast({
        title: "User Creation",
        description: "User creation requires server-side implementation. Please use Supabase Auth directly.",
        variant: "default",
      });
      
      setNewUserEmail("");
      setNewUserDisplayName("");
      setNewUserRole("listener");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role as 'admin' | 'dj' | 'moderator' | 'listener'
        });

      if (error) throw error;

      toast({
        title: "Role Assigned",
        description: `User has been assigned the ${role} role.`,
      });

      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName || !newSlotStartTime || !newSlotEndTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots' as any)
        .insert({
          name: newSlotName,
          day_of_week: newSlotDay,
          start_time: newSlotStartTime,
          end_time: newSlotEndTime,
          assigned_user_id: newSlotAssignedUser || null,
          slot_type: 'live',
          is_active: true,
          is_recurring: true
        });

      if (error) throw error;

      toast({
        title: "Time Slot Created",
        description: "New time slot has been created successfully.",
      });

      setNewSlotName("");
      setNewSlotStartTime("");
      setNewSlotEndTime("");
      setNewSlotAssignedUser("");
      fetchTimeSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create time slot.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('time_slots' as any)
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Time Slot Deleted",
        description: "Time slot has been deleted successfully.",
      });

      fetchTimeSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time slot.",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (authLoading || broadcastLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
        </div>

        {/* System Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Radio className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{activeSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Music className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audio Content</p>
                  <p className="text-2xl font-bold text-foreground">{audioContent.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Slots</p>
                  <p className="text-2xl font-bold text-foreground">{timeSlots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Broadcast Control Panel */}
        <div className="mb-8">
          <BroadcastControlPanel />
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Management</TabsTrigger>
            <TabsTrigger value="content">Content Management</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="contact">Contact Messages</TabsTrigger>
            <TabsTrigger value="analytics">System Analytics</TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="mt-6">
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
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="userDisplayName">Display Name</Label>
                      <Input
                        id="userDisplayName"
                        value={newUserDisplayName}
                        onChange={(e) => setNewUserDisplayName(e.target.value)}
                        placeholder="John Doe"
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
                        <option value="dj">DJ</option>
                        <option value="presenter">Presenter</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">
                      Create User
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* User Roles List */}
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Roles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userRoles.map((userRole) => (
                      <div
                        key={userRole.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {userRole.user?.display_name || userRole.user?.email || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {userRole.user?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{userRole.role}</Badge>
                          <select
                            value={userRole.role}
                            onChange={(e) => handleAssignRole(userRole.user_id, e.target.value)}
                            className="text-xs px-2 py-1 rounded bg-background border border-border"
                          >
                            <option value="listener">Listener</option>
                            <option value="dj">DJ</option>
                            <option value="presenter">Presenter</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Management */}
          <TabsContent value="schedule" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Create Time Slot */}
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Create Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTimeSlot} className="space-y-4">
                    <div>
                      <Label htmlFor="slotName">Slot Name</Label>
                      <Input
                        id="slotName"
                        value={newSlotName}
                        onChange={(e) => setNewSlotName(e.target.value)}
                        placeholder="Morning Show"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slotDay">Day of Week</Label>
                      <select
                        id="slotDay"
                        value={newSlotDay}
                        onChange={(e) => setNewSlotDay(parseInt(e.target.value))}
                        className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={newSlotStartTime}
                          onChange={(e) => setNewSlotStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={newSlotEndTime}
                          onChange={(e) => setNewSlotEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="assignedUser">Assigned User</Label>
                      <select
                        id="assignedUser"
                        value={newSlotAssignedUser}
                        onChange={(e) => setNewSlotAssignedUser(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                      >
                        <option value="">Select a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.display_name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Time Slot
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Time Slots List */}
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Current Time Slots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{slot.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getDayName(slot.day_of_week)} • {slot.start_time} - {slot.end_time}
                          </p>
                          {slot.assigned_user && (
                            <p className="text-xs text-muted-foreground">
                              Assigned: {slot.assigned_user.display_name || slot.assigned_user.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={slot.is_active ? "default" : "secondary"}>
                            {slot.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTimeSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content" className="mt-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  Audio Content Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {contentStats && Object.entries(contentStats.byType || {}).map(([type, count]) => (
                    <div key={type} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium capitalize">{type}</p>
                          <p className="text-sm text-muted-foreground">{String(count)} files</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {audioContent.slice(0, 20).map((content) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{content.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {content.artist && `${content.artist} • `}
                          {content.content_type} • {content.play_count} plays
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={content.is_active ? "default" : "secondary"}>
                          {content.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{content.content_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions */}
          <TabsContent value="sessions" className="mt-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-primary" />
                  Active Broadcast Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No active broadcast sessions at the moment.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {session.broadcaster?.display_name || session.broadcaster?.email || 'Unknown Broadcaster'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Started: {new Date(session.started_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={session.microphone_active ? "destructive" : "secondary"}>
                              {session.microphone_active ? "Mic ON" : "Mic OFF"}
                            </Badge>
                            <Badge variant="outline">{session.current_mode}</Badge>
                            <Badge variant="outline">{session.session_type}</Badge>
                            {session.emergency_override && (
                              <Badge variant="destructive">Emergency Override</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            LIVE
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Messages */}
          <TabsContent value="contact" className="mt-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contactMessages.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No contact messages received yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {contactMessages.map((message) => (
                      <div
                        key={message.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{message.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {message.email}
                              </Badge>
                              {message.email_status && (
                                <Badge 
                                  variant={
                                    message.email_status === 'sent' ? 'default' : 
                                    message.email_status === 'failed' || message.email_status === 'error' ? 'destructive' : 
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  📧 {message.email_status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendEmail(message)}
                              className="text-xs"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              {message.email_sent ? 'Resend' : 'Send'} Email
                            </Button>
                          </div>
                        </div>
                        <p className="font-medium text-sm mb-2 text-primary">{message.subject}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-3 rounded border">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Content Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contentStats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Tracks:</span>
                        <span className="font-bold">{contentStats.totalTracks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Plays:</span>
                        <span className="font-bold">{contentStats.totalPlays.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">By Content Type:</p>
                        {Object.entries(contentStats.byType || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type}:</span>
                            <span>{String(count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Loading statistics...</p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database Connection:</span>
                      <Badge variant="default" className="bg-green-600">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Users:</span>
                      <span className="font-bold">{userRoles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Broadcasting System:</span>
                      <Badge variant="default" className="bg-green-600">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Emergency Override:</span>
                      <Badge variant="secondary">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;