import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useRoleRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);

  const redirectBasedOnRole = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        
        // Priority order: admin > dj/presenter > moderator > listener
        if (roles.includes('admin')) {
          // Only redirect if not already on admin dashboard
          if (location.pathname !== '/admin') {
            navigate("/admin", { replace: true });
          }
        } else if (roles.some(role => ['dj', 'presenter'].includes(role))) {
          // Only redirect if not already on DJ dashboard
          if (location.pathname !== '/dj') {
            navigate("/dj", { replace: true });
          }
        } else {
          // For moderators and listeners, go to home page only if on auth page
          if (location.pathname === '/auth') {
            navigate("/", { replace: true });
          }
        }
      } else {
        // No roles assigned, go to home page only if on auth page
        if (location.pathname === '/auth') {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
      // Fallback to home page only if on auth page
      if (location.pathname === '/auth') {
        navigate("/", { replace: true });
      }
    } finally {
      setIsChecking(false);
    }
  };

  return { redirectBasedOnRole, isChecking };
};