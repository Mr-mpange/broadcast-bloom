import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("show_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching favorites:", error);
      } else {
        setFavorites(data.map((f) => f.show_id));
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  const toggleFavorite = useCallback(
    async (showId: string) => {
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }

      const isFavorite = favorites.includes(showId);

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("show_id", showId);

        if (error) {
          toast.error("Failed to remove favorite");
          console.error(error);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== showId));
          toast.success("Removed from favorites");
        }
      } else {
        // Add favorite
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, show_id: showId });

        if (error) {
          toast.error("Failed to add favorite");
          console.error(error);
        } else {
          setFavorites((prev) => [...prev, showId]);
          toast.success("Added to favorites");
        }
      }
    },
    [user, favorites]
  );

  const isFavorite = useCallback(
    (showId: string) => favorites.includes(showId),
    [favorites]
  );

  return { favorites, loading, toggleFavorite, isFavorite };
};
