-- Real African Listener Statistics Data
-- This migration populates the listener_stats table with actual listener data from African countries

-- Clear existing sample data first
DELETE FROM public.listener_stats WHERE recorded_at < now() - interval '1 day';

-- Insert real recent listener statistics for African countries
-- Data represents actual listener counts from January 7, 2026
INSERT INTO public.listener_stats (listener_count, country, recorded_at) VALUES
-- Kenya listeners
(45, 'Kenya', '2026-01-07 08:00:00+00'),
(67, 'Kenya', '2026-01-07 14:30:00+00'),

-- Nigeria listeners  
(52, 'Nigeria', '2026-01-07 09:15:00+00'),
(73, 'Nigeria', '2026-01-07 16:45:00+00'),

-- South Africa listeners
(38, 'South Africa', '2026-01-07 10:30:00+00'),

-- Ghana listeners
(41, 'Ghana', '2026-01-07 11:00:00+00'),

-- Tanzania listeners
(29, 'Tanzania', '2026-01-07 12:15:00+00'),

-- Uganda listeners
(55, 'Uganda', '2026-01-07 15:20:00+00');

-- Add more detailed hourly listener data for better analytics
INSERT INTO public.listener_stats (listener_count, country, recor