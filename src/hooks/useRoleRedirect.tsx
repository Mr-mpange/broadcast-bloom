import { useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useRoleRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);

  const redirectBasedOnRole = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping redirect');
      return;
    }

    setIsChecking(true);
    try {
      console.log('Checking roles for user:', user.id, 'email:', user.email);
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching user roles:", error);
        console.log('Redirecting to home due to error');
        if (location.pathname === '/auth') {
          navigate("/", { replace: true });
        }
        return;
      }
      
      console.log('User roles query result:', data);
      
      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        console.log('User roles found:', roles);
        
        // Priority order: admin > dj > presenter > moderator > listener
        if (roles.includes('admin')) {
          console.log('User is admin - redirecting to /admin');
          navigate("/admin", { replace: true });
        } else if (roles.includes('dj')) {
          console.log('User is DJ - redirecting to /dj');
          navigate("/dj", { replace: true });
        } else if (roles.includes('presenter')) {
          console.log('User is presenter - redirecting to /presenter');
          navigate("/presenter", { replace: true });
        } else if (roles.includes('moderator')) {
          console.log('User is moderator - redirecting to /moderator');
          navigate("/moderator", { replace: true });
        } else {
          console.log('User has other role - redirecting to home');
          navigate("/", { replace: true });
        }
      } else {
        console.log('No roles found for user - redirecting to home');
        if (location.pathname === '/auth') {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error("Exception in role check:", error);
      if (location.pathname === '/auth') {
        navigate("/", { replace: true });
      }
    } finally {
      setIsChecking(false);
    }
  }, [user, navigate, location.pathname]);

  return { redirectBasedOnRole, isChecking };
};