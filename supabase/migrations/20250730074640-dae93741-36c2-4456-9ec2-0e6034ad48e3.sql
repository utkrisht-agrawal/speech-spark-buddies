-- Create detailed exercise progress tracking
CREATE TABLE public.exercise_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  item_index INTEGER NOT NULL, -- for phonemes/words/sentences within exercise
  item_content TEXT NOT NULL, -- the actual phoneme/word/sentence
  last_score INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create level progress tracking
CREATE TABLE public.level_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id INTEGER NOT NULL,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  completed_exercises INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  pass_score INTEGER NOT NULL DEFAULT 80,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Create level configuration table for admin management
CREATE TABLE public.level_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id INTEGER NOT NULL UNIQUE,
  pass_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_progress
CREATE POLICY "Users can view their own exercise progress" 
ON public.exercise_progress 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own exercise progress" 
ON public.exercise_progress 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exercise progress" 
ON public.exercise_progress 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Therapists can view children exercise progress" 
ON public.exercise_progress 
FOR SELECT 
USING (get_current_user_role() = 'therapist');

-- RLS Policies for level_progress
CREATE POLICY "Users can view their own level progress" 
ON public.level_progress 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own level progress" 
ON public.level_progress 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Therapists can view children level progress" 
ON public.level_progress 
FOR SELECT 
USING (get_current_user_role() = 'therapist');

-- RLS Policies for level_config
CREATE POLICY "Everyone can view level config" 
ON public.level_config 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage level config" 
ON public.level_config 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Triggers for updated_at
CREATE TRIGGER update_exercise_progress_updated_at
BEFORE UPDATE ON public.exercise_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_level_progress_updated_at
BEFORE UPDATE ON public.level_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_level_config_updated_at
BEFORE UPDATE ON public.level_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default level configurations
INSERT INTO public.level_config (level_id, pass_score) VALUES
(1, 80),
(2, 85),
(3, 85),
(4, 85),
(5, 88),
(6, 90),
(7, 90),
(8, 92);