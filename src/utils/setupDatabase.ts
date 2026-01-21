import { supabase } from '@/integrations/supabase/client';

export const setupRadioDatabase = async () => {
  const results = {
    success: false,
    errors: [] as string[],
    created: [] as string[],
  };

  try {
    // Check if broadcast_sessions table exists and create if needed
    const { error: sessionsError } = await supabase.rpc('create_broadcast_sessions_table');
    if (sessionsError && !sessionsError.message.includes('already exists')) {
      results.errors.push(`Broadcast sessions: ${sessionsError.message}`);
    } else {
      results.created.push('broadcast_sessions');
    }

    // Check if time_slots table exists and create if needed
    const { error: timeSlotsError } = await supabase.rpc('create_time_slots_table');
    if (timeSlotsError && !timeSlotsError.message.includes('already exists')) {
      results.errors.push(`Time slots: ${timeSlotsError.message}`);
    } else {
      results.created.push('time_slots');
    }

    // Check if emergency_broadcasts table exists and create if needed
    const { error: emergencyError } = await supabase.rpc('create_emergency_broadcasts_table');
    if (emergencyError && !emergencyError.message.includes('already exists')) {
      results.errors.push(`Emergency broadcasts: ${emergencyError.message}`);
    } else {
      results.created.push('emergency_broadcasts');
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error: any) {
    results.errors.push(`Database setup failed: ${error.message}`);
    return results;
  }
};

// Alternative: Direct table creation (if RPC functions don't exist)
export const createTablesDirectly = async () => {
  const results = {
    success: false,
    errors: [] as string[],
    created: [] as string[],
  };

  try {
    // Create broadcast_sessions table
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS broadcast_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          broadcaster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          session_type VARCHAR(20) DEFAULT 'live',
          status VARCHAR(20) DEFAULT 'active',
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ended_at TIMESTAMP WITH TIME ZONE,
          microphone_active BOOLEAN DEFAULT false,
          current_mode VARCHAR(20) DEFAULT 'automation',
          emergency_override BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add constraint to ensure only one live session at a time
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_live_session 
        ON broadcast_sessions (session_type) 
        WHERE status = 'active' AND session_type = 'live';

        -- Add RLS policies
        ALTER TABLE broadcast_sessions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view their own sessions" ON broadcast_sessions
        FOR SELECT USING (auth.uid() = broadcaster_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert their own sessions" ON broadcast_sessions
        FOR INSERT WITH CHECK (auth.uid() = broadcaster_id);
        
        CREATE POLICY IF NOT EXISTS "Users can update their own sessions" ON broadcast_sessions
        FOR UPDATE USING (auth.uid() = broadcaster_id);
      `
    });

    if (sessionsError) {
      results.errors.push(`Broadcast sessions: ${sessionsError.message}`);
    } else {
      results.created.push('broadcast_sessions');
    }

    // Create time_slots table
    const { error: timeSlotsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS time_slots (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          backup_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_recurring BOOLEAN DEFAULT true,
          slot_type VARCHAR(20) DEFAULT 'live',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Anyone can view active time slots" ON time_slots
        FOR SELECT USING (is_active = true);
        
        CREATE POLICY IF NOT EXISTS "Assigned users can view their slots" ON time_slots
        FOR SELECT USING (auth.uid() = assigned_user_id OR auth.uid() = backup_user_id);
      `
    });

    if (timeSlotsError) {
      results.errors.push(`Time slots: ${timeSlotsError.message}`);
    } else {
      results.created.push('time_slots');
    }

    // Create emergency_broadcasts table
    const { error: emergencyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS emergency_broadcasts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          priority_level INTEGER DEFAULT 1,
          broadcast_type VARCHAR(50) DEFAULT 'emergency',
          triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ended_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'active',
          affected_sessions UUID[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE emergency_broadcasts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Anyone can view active emergencies" ON emergency_broadcasts
        FOR SELECT USING (status = 'active');
      `
    });

    if (emergencyError) {
      results.errors.push(`Emergency broadcasts: ${emergencyError.message}`);
    } else {
      results.created.push('emergency_broadcasts');
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error: any) {
    results.errors.push(`Direct table creation failed: ${error.message}`);
    return results;
  }
};

// Create RPC function to get active live session
export const createGetActiveLiveSessionFunction = async () => {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_active_live_session()
        RETURNS TABLE (
          session_id UUID,
          broadcaster_id UUID,
          broadcaster_name TEXT,
          started_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            bs.id as session_id,
            bs.broadcaster_id,
            COALESCE(p.display_name, p.username, 'Unknown') as broadcaster_name,
            bs.started_at
          FROM broadcast_sessions bs
          LEFT JOIN profiles p ON p.id = bs.broadcaster_id
          WHERE bs.status = 'active' 
            AND bs.session_type = 'live'
          ORDER BY bs.started_at DESC
          LIMIT 1;
        END;
        $$;
      `
    });

    return { success: !error, error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};