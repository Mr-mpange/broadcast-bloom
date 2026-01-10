-- Add sample shows to populate the Featured Shows section
-- Run this in your Supabase SQL Editor to add real shows

-- First, let's check if we have any users to assign as hosts
-- You can replace these UUIDs with actual user IDs from your profiles table

INSERT INTO public.shows (
  name,
  description,
  genre,
  image_url,
  is_active,
  is_featured,
  host_id
) VALUES 
(
  'Morning Vibes',
  'Start your day with the perfect mix of upbeat tracks and positive energy. Join us every morning for the latest hits and feel-good classics.',
  'Pop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop',
  true,
  true,
  (SELECT id FROM profiles LIMIT 1) -- Uses first available user as host
),
(
  'Jazz After Dark',
  'Smooth jazz and soulful melodies to wind down your evening. Perfect for late-night listening with a sophisticated sound.',
  'Jazz',
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&h=400&fit=crop',
  true,
  true,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Hip Hop Central',
  'The hottest hip hop tracks, exclusive interviews, and underground gems. Your source for the culture and the beats.',
  'Hip Hop',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop',
  true,
  true,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Electronic Pulse',
  'Electronic beats, EDM anthems, and the latest in dance music. Get ready to move to the rhythm of the future.',
  'Electronic',
  'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=600&h=400&fit=crop',
  true,
  true,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Afrobeats Takeover',
  'The best of Afrobeats, Afropop, and African music. Celebrating the sounds that are taking over the world.',
  'Afrobeats',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=400&fit=crop',
  true,
  true,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Rock Revolution',
  'Classic rock, modern rock, and everything in between. Turn up the volume and feel the power of rock music.',
  'Rock',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
  true,
  false, -- Not featured
  (SELECT id FROM profiles LIMIT 1)
);

-- Update the first few shows to be featured
UPDATE public.shows 
SET is_featured = true 
WHERE name IN ('Morning Vibes', 'Jazz After Dark', 'Hip Hop Central', 'Electronic Pulse', 'Afrobeats Takeover');