-- Add RLS policies to allow users to view leaderboard data

-- Allow all authenticated users to view basic profile info for leaderboard
CREATE POLICY "Users can view basic profile info for leaderboard" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Allow all authenticated users to view user progress for leaderboard
CREATE POLICY "Users can view progress for leaderboard" 
ON public.user_progress 
FOR SELECT 
TO authenticated
USING (true);