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
      console.log('Checking roles for user:', user.id); // Debug log
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching user roles:", error);
        // Fallback to home page if on auth page
        if (location.pathname === '/auth') {
          navigate("/", { replace: true });
        }
        return;
      }
      
      console.log('User roles data:', data); // Debug log
      
      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        console.log('User roles:', roles); // Debug log
        
        // Priority order: admin > dj/presenter > moderator > listener
        if (roles.includes('admin')) {
          console.log('Redirecting admin to /admin'); // Debug log
          navigate("/admin", { replace: true });
        } else if (roles.some(role => ['dj', 'presenter'].includes(role))) {
          console.log('Redirecting DJ/Presenter to /dj'); // Debug log
          navigate("/dj", { replace: true });
        } else if (roles.includes('moderator')) {
          console.log('Redirecting moderator to /dj'); // Debug log
          navigate("/dj", { replace: true }); // Moderators also get DJ dashboard access
        } else {
          // For listeners, go to home page
          console.log('Redirecting listener to home'); // Debug log
          navigate("/", { replace: true });
        }
      } else {
        console.log('No roles found, redirecting to home'); // Debug log
        // No roles assigned, go to home page
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
      // Fallback to home page
      navigate("/", { replace: true });
    } finally {
      setIsChecking(false);
    }
  };

  return { redirectBasedOnRole, isChecking };
};