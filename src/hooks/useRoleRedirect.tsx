import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useRoleRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          navigate("/admin");
        } else if (roles.some(role => ['dj', 'presenter'].includes(role))) {
          navigate("/dj");
        } else {
          // For moderators and listeners, go to home page
          navigate("/");
        }
      } else {
        // No roles assigned, go to home page
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
      // Fallback to home page
      navigate("/");
    } finally {
      setIsChecking(false);
    }
  };

  return { redirectBasedOnRole, isChecking };
};