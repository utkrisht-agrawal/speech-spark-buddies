-- Add assessment_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN assessment_completed BOOLEAN DEFAULT FALSE;