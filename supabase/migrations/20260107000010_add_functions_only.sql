-- Add functions and triggers for new features

-- Function to notify favorite show users when show goes live
CREATE OR REPLACE FUNCTION public.notify_favorite_show_live()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  show_name TEXT;
  user_record RECORD;
BEGIN
  SELECT name INTO show_name FROM public.shows WHERE id = NEW.show_id;
  
  FOR user_record IN 
    SELECT DISTINCT f.user_id 
    FROM public.favorites f 
    WHERE f.show_id = NEW.show_id
  LOOP
    INSERT INTO public.notifications (user_id, show_id, type, title, message)
    VALUES (
      user_record.user_id,
      NEW.show_id,
      'show_live',
      'Your favorite show is now live!',
      show_name || ' has just started broadcasting. Tune in now!'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to create chat room when show is created
CREATE OR REPLACE FUNCTION public.create_chat_room_for_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chat_rooms (show_id, name, description)
  VALUES (
    NEW.id,
    NEW.name || ' Chat',
    'Chat room for ' || NEW.name || ' listeners'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_show_goes_live') THEN
        CREATE TRIGGER on_show_goes_live
          AFTER INSERT ON public.live_shows
          FOR EACH ROW 
          WHEN (NEW.is_live = true)
          EXECUTE FUNCTION public.notify_favorite_show_live();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_show_created_create_chat') THEN
        CREATE TRIGGER on_show_created_create_chat
          AFTER INSERT ON public.shows
          FOR EACH ROW 
          EXECUTE FUNCTION public.create_chat_room_for_show();
    END IF;
END $$;