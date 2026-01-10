import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type BroadcastMode = 'live' | 'automation';
export type SessionStatus = 'active' | 'ended' | 'interrupted';
export type UserRole = 'admin' | 'dj' | 'presenter' | 'moderator' | 'listener';

interface BroadcastSession {
  id: string;
  broadcaster_id: string;
  session_type: string;
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
  microphone_active: boolean;
  current_mode: BroadcastMode;
  emergency_override: boolean;
  notes?: string;
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
  slot_type: 'live' | 'automation' | 'maintenance';
  is_active: boolean;
}

interface BroadcastPermissions {
  canGoLive: boolean;
  canControlMicrophone: boolean;
  canControlMusic: boolean;
  canTriggerJingles: boolean;
  canSwitchModes: boolean;
  canEmergencyOverride: boolean;
  canManageAudio: boolean;
  canViewAnalytics: boolean;
}

export const useBroadcastControl = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentSession, setCurrentSession] = useState<BroadcastSession | null>(null);
  const [permissions, setPermissions] = useState<BroadcastPermissions>({
    canGoLive: false,
    canControlMicrophone: false,
    canControlMusic: false,
    canTriggerJingles: false,
    canSwitchModes: false,
    canEmergencyOverride: false,
    canManageAudio: false,
    canViewAnalytics: false,
  });
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<BroadcastMode>('automation');

  // Check user permissions based on role
  const checkPermissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roles || roles.length === 0) return;

      const userRoles = roles.map(r => r.role as UserRole);
      const isAdmin = userRoles.includes('admin');
      const isDJ = userRoles.includes('dj');
      const isPresenter = userRoles.includes('presenter');

      setPermissions({
        canGoLive: isAdmin || isDJ || isPresenter,
        canControlMicrophone: isAdmin || isDJ || isPresenter,
        canControlMusic: isAdmin || isDJ,
        canTriggerJingles: isAdmin || isDJ || isPresenter,
        canSwitchModes: isAdmin || isDJ,
        canEmergencyOverride: isAdmin,
        canManageAudio: isAdmin,
        canViewAnalytics: isAdmin || isDJ,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, [user]);

  // Check if user can broadcast now
  const checkCanBroadcastNow = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use direct query instead of RPC for now
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.toTimeString().slice(0, 8);

      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) return true;

      // Check if user has active time slot
      const { data: timeSlot } = await supabase
        .from('time_slots' as any)
        .select('*')
        .eq('assigned_user_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)
        .eq('is_active', true)
        .eq('slot_type', 'live')
        .maybeSingle();

      return !!timeSlot;
    } catch (error) {
      console.error('Error checking broadcast permission:', error);
      return false;
    }
  }, [user]);

  // Get current time slot
  const getCurrentTimeSlot = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.toTimeString().slice(0, 8);

      const { data, error } = await supabase
        .from('time_slots' as any)
        .select('*')
        .eq('assigned_user_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)
        .eq('is_active', true)
        .eq('slot_type', 'live')
        .maybeSingle();

      if (!error && data) {
        setCurrentTimeSlot(data as unknown as TimeSlot);
      }
    } catch (error) {
      console.error('Error getting current time slot:', error);
    }
  }, [user]);

  // Start broadcast session
  const startBroadcastSession = async (sessionType: 'live' | 'automation' = 'live') => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to start broadcasting.',
        variant: 'destructive',
      });
      return null;
    }

    const canBroadcast = await checkCanBroadcastNow();
    if (!canBroadcast) {
      toast({
        title: 'Not Authorized',
        description: 'You are not authorized to broadcast at this time.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // End any existing active sessions for this user
      await supabase
        .from('broadcast_sessions' as any)
        .update({ status: 'interrupted', ended_at: new Date().toISOString() })
        .eq('broadcaster_id', user.id)
        .eq('status', 'active');

      // Create new session
      const { data: session, error } = await supabase
        .from('broadcast_sessions' as any)
        .insert({
          broadcaster_id: user.id,
          session_type: sessionType,
          status: 'active',
          started_at: new Date().toISOString(),
          microphone_active: false,
          current_mode: 'automation',
          emergency_override: false
        })
        .select()
        .single();

      if (error) throw error;

      if (session) {
        const broadcastSession = session as unknown as BroadcastSession;
        setCurrentSession(broadcastSession);
        setCurrentMode(broadcastSession.current_mode);
        setMicrophoneActive(broadcastSession.microphone_active);
        
        toast({
          title: 'Broadcast Started',
          description: `You are now live in ${sessionType} mode.`,
        });

        return (session as any).id;
      }

      return null;
    } catch (error: any) {
      console.error('Error starting broadcast session:', error);
      toast({
        title: 'Failed to Start Broadcast',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // End broadcast session
  const endBroadcastSession = async () => {
    if (!currentSession) return false;

    try {
      const { error } = await supabase
        .from('broadcast_sessions' as any)
        .update({ 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', currentSession.id)
        .eq('broadcaster_id', user?.id);

      if (error) throw error;

      setCurrentSession(null);
      setMicrophoneActive(false);
      setCurrentMode('automation');
      
      toast({
        title: 'Broadcast Ended',
        description: 'Your broadcast session has ended.',
      });

      return true;
    } catch (error: any) {
      console.error('Error ending broadcast session:', error);
      toast({
        title: 'Failed to End Broadcast',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!currentSession || !permissions.canControlMicrophone) return false;

    const newState = !microphoneActive;

    try {
      // Update session
      const { error } = await supabase
        .from('broadcast_sessions' as any)
        .update({ microphone_active: newState })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Log the action to broadcast_log table directly (temporarily disabled)
      console.log('Microphone toggled:', { action_type: newState ? 'mic_on' : 'mic_off' });
      
      /* Temporarily disabled - table doesn't exist yet
      await supabase
        .from('broadcast_log' as any)
        .insert({
          session_id: currentSession.id,
          user_id: user?.id,
          action_type: newState ? 'mic_on' : 'mic_off',
          timestamp: new Date().toISOString()
        });
      */

      setMicrophoneActive(newState);
      
      toast({
        title: `Microphone ${newState ? 'On' : 'Off'}`,
        description: `Your microphone is now ${newState ? 'active' : 'muted'}.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error toggling microphone:', error);
      toast({
        title: 'Microphone Control Failed',
        description: error.message || 'Failed to control microphone.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Switch broadcast mode
  const switchMode = async (mode: BroadcastMode) => {
    if (!currentSession || !permissions.canSwitchModes) return false;

    try {
      // Update session
      const { error } = await supabase
        .from('broadcast_sessions' as any)
        .update({ current_mode: mode })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Log the action (temporarily disabled)
      console.log('Mode switched:', { new_mode: mode, previous_mode: currentMode });
      
      /* Temporarily disabled - table doesn't exist yet
      await supabase
        .from('broadcast_log' as any)
        .insert({
          session_id: currentSession.id,
          user_id: user?.id,
          action_type: 'mode_switch',
          action_details: JSON.stringify({ new_mode: mode, previous_mode: currentMode }),
          timestamp: new Date().toISOString()
        });
      */

      setCurrentMode(mode);
      
      toast({
        title: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
        description: `Broadcasting mode changed to ${mode}.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error switching mode:', error);
      toast({
        title: 'Mode Switch Failed',
        description: error.message || 'Failed to switch broadcast mode.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Log broadcast action (temporarily disabled due to missing table)
  const logAction = async (
    actionType: string, 
    actionDetails?: any, 
    contentId?: string
  ) => {
    if (!currentSession) return;

    try {
      // TODO: Re-enable when broadcast_log table is created
      console.log('Broadcast action logged:', { actionType, actionDetails, contentId });
      
      /* Temporarily disabled - table doesn't exist yet
      await supabase
        .from('broadcast_log' as any)
        .insert({
          session_id: currentSession.id,
          user_id: user?.id,
          action_type: actionType,
          action_details: actionDetails ? JSON.stringify(actionDetails) : null,
          content_id: contentId || null,
          timestamp: new Date().toISOString()
        });
      */
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Trigger emergency override (admin only)
  const triggerEmergencyOverride = async (
    title: string,
    message: string,
    priorityLevel: number = 1,
    broadcastType: string = 'emergency'
  ) => {
    if (!permissions.canEmergencyOverride) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to trigger emergency override.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Get all active sessions that will be affected
      const { data: activeSessions } = await supabase
        .from('broadcast_sessions' as any)
        .select('id')
        .eq('status', 'active');

      const affectedSessionIds = activeSessions?.map((s: any) => s.id) || [];

      // Create emergency broadcast record
      const { data: emergency, error } = await supabase
        .from('emergency_broadcasts' as any)
        .insert({
          title,
          message,
          priority_level: priorityLevel,
          broadcast_type: broadcastType,
          triggered_by: user?.id,
          triggered_at: new Date().toISOString(),
          status: 'active',
          affected_sessions: affectedSessionIds
        })
        .select()
        .single();

      if (error) throw error;

      // Mark all active sessions as interrupted by emergency
      if (affectedSessionIds.length > 0) {
        await supabase
          .from('broadcast_sessions' as any)
          .update({ emergency_override: true })
          .in('id', affectedSessionIds);
      }

      toast({
        title: 'Emergency Override Activated',
        description: 'Emergency broadcast has been triggered.',
        variant: 'destructive',
      });

      return (emergency as any)?.id;
    } catch (error: any) {
      console.error('Error triggering emergency override:', error);
      toast({
        title: 'Emergency Override Failed',
        description: error.message || 'Failed to trigger emergency override.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Subscribe to broadcast session changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('broadcast_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_sessions',
          filter: `broadcaster_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const session = payload.new as BroadcastSession;
            setCurrentSession(session);
            setMicrophoneActive(session.microphone_active);
            setCurrentMode(session.current_mode);
          } else if (payload.eventType === 'DELETE') {
            setCurrentSession(null);
            setMicrophoneActive(false);
            setCurrentMode('automation');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await checkPermissions();
      await getCurrentTimeSlot();
      
      // Check for existing active session
      if (user) {
        const { data, error } = await supabase
          .from('broadcast_sessions' as any)
          .select('*')
          .eq('broadcaster_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!error && data) {
          const session = data as unknown as BroadcastSession;
          setCurrentSession(session);
          setMicrophoneActive(session.microphone_active);
          setCurrentMode(session.current_mode);
        }
      }
      
      setLoading(false);
    };

    initialize();
  }, [user, checkPermissions, getCurrentTimeSlot]);

  return {
    // State
    currentSession,
    permissions,
    currentTimeSlot,
    loading,
    microphoneActive,
    currentMode,
    
    // Actions
    startBroadcastSession,
    endBroadcastSession,
    toggleMicrophone,
    switchMode,
    logAction,
    triggerEmergencyOverride,
    checkCanBroadcastNow,
    
    // Computed
    isLive: currentSession?.status === 'active',
    canBroadcast: permissions.canGoLive,
  };
};