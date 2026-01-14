-- Update user_role enum to include 'presenter'
-- Run this in your Supabase SQL Editor

-- First, add the new value to the enum
ALTER TYPE user_role ADD VALUE 'presenter';

-- Verify the enum values
SELECT unnest(enum_range(NULL::user_role)) AS role_values;