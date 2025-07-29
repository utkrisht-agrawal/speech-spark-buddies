-- Create comprehensive database schema for VoiceBuddy app (without existing trigger)

-- Add current_level column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date;

-- Create exercises table (for therapist-created exercises)
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('phoneme', 'word', 'sentence', 'breathing', 'game')),
  title text NOT NULL,
  instruction text NOT NULL,
  content jsonb NOT NULL, -- Can store string or array of strings
  target_phonemes text[],
  difficulty integer NOT NULL CHECK (difficulty IN (1, 2, 3)),
  points integer NOT NULL DEFAULT 10,
  required_accuracy integer NOT NULL DEFAULT 70,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create exercise_assignments table (therapist assigns exercises to children)
CREATE TABLE IF NOT EXISTS public.exercise_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means assigned to all
  assigned_by uuid REFERENCES auth.users(id) NOT NULL,
  age_group text, -- 'all', '3-5', '6-8', '9-12', etc.
  assignment_type text NOT NULL CHECK (assignment_type IN ('daily', 'level', 'individual')),
  target_level integer, -- for level assignments
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_progress table (tracks individual exercise completion)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.exercise_assignments(id) ON DELETE CASCADE,
  exercise_type text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  accuracy integer NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, assignment_id)
);

-- Create daily_activities table (tracks daily practice)
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  phonemes_practiced integer DEFAULT 0,
  words_practiced integer DEFAULT 0,
  sentences_practiced integer DEFAULT 0,
  exercises_completed integer DEFAULT 0,
  total_xp_earned integer DEFAULT 0,
  session_duration integer DEFAULT 0, -- in minutes
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL, -- conditions to earn badge
  points_reward integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_badges table (earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for exercises
CREATE POLICY "Therapists can create exercises" ON public.exercises
  FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() = 'therapist');

CREATE POLICY "Therapists can view their own exercises" ON public.exercises
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Children can view assigned exercises" ON public.exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_assignments ea
      WHERE ea.exercise_id = exercises.id 
      AND (ea.assigned_to = auth.uid() OR ea.assigned_to IS NULL)
      AND ea.is_active = true
    )
  );

CREATE POLICY "Therapists can update their own exercises" ON public.exercises
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for exercise_assignments
CREATE POLICY "Therapists can create assignments" ON public.exercise_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid() AND
    public.get_current_user_role() = 'therapist'
  );

CREATE POLICY "Therapists can view their assignments" ON public.exercise_assignments
  FOR SELECT TO authenticated
  USING (assigned_by = auth.uid());

CREATE POLICY "Children can view their assignments" ON public.exercise_assignments
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_to IS NULL);

-- RLS Policies for user_progress
CREATE POLICY "Users can create their own progress" ON public.user_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Therapists can view children progress" ON public.user_progress
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'therapist');

-- RLS Policies for daily_activities
CREATE POLICY "Users can manage their daily activities" ON public.daily_activities
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Therapists can view children activities" ON public.daily_activities
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'therapist');

-- RLS Policies for badges
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT TO authenticated
  USING (is_active = true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can award badges" ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create triggers for updated_at (skip if already exists)
DO $$
BEGIN
  -- Check if trigger exists for exercises
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exercises_updated_at') THEN
    CREATE TRIGGER update_exercises_updated_at
      BEFORE UPDATE ON public.exercises
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Check if trigger exists for daily_activities
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_daily_activities_updated_at') THEN
    CREATE TRIGGER update_daily_activities_updated_at
      BEFORE UPDATE ON public.daily_activities
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, criteria) VALUES
('First Steps', 'Complete your first exercise', '👶', '{"type": "exercise_count", "value": 1}'),
('Word Warrior', 'Practice 50 words', '🏆', '{"type": "words_count", "value": 50}'),
('Phoneme Pro', 'Master 20 phonemes', '🎯', '{"type": "phonemes_count", "value": 20}'),
('Sentence Star', 'Complete 30 sentences', '⭐', '{"type": "sentences_count", "value": 30}'),
('7-Day Streak', 'Practice for 7 days in a row', '🔥', '{"type": "streak", "value": 7}'),
('Perfect Score', 'Get 100% accuracy on an exercise', '💯', '{"type": "perfect_accuracy", "value": 1}'),
('Daily Achiever', 'Complete daily practice target', '📅', '{"type": "daily_target", "value": 1}'),
('Level Up', 'Advance to next level', '🆙', '{"type": "level_up", "value": 1}'),
('Practice Champion', 'Complete 100 exercises', '🏅', '{"type": "exercise_count", "value": 100}'),
('Speech Master', 'Reach level 5', '👑', '{"type": "level_reached", "value": 5}')
ON CONFLICT (name) DO NOTHING;