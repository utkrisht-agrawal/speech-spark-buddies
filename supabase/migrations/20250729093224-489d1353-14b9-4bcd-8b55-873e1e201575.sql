-- Add admin role to existing enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';

-- Create student_therapist_assignments table
CREATE TABLE public.student_therapist_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  therapist_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, therapist_id)
);

-- Create student_parent_assignments table
CREATE TABLE public.student_parent_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

-- Enable RLS on both tables
ALTER TABLE public.student_therapist_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parent_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_therapist_assignments
CREATE POLICY "Admins can manage all therapist assignments" 
ON public.student_therapist_assignments 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Therapists can view their own students" 
ON public.student_therapist_assignments 
FOR SELECT 
USING (therapist_id = auth.uid() AND is_active = true);

CREATE POLICY "Students can view their therapist assignments" 
ON public.student_therapist_assignments 
FOR SELECT 
USING (student_id = auth.uid() AND is_active = true);

-- RLS policies for student_parent_assignments
CREATE POLICY "Admins can manage all parent assignments" 
ON public.student_parent_assignments 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Parents can view their own students" 
ON public.student_parent_assignments 
FOR SELECT 
USING (parent_id = auth.uid() AND is_active = true);

CREATE POLICY "Students can view their parent assignments" 
ON public.student_parent_assignments 
FOR SELECT 
USING (student_id = auth.uid() AND is_active = true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_student_therapist_assignments_updated_at
BEFORE UPDATE ON public.student_therapist_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_parent_assignments_updated_at
BEFORE UPDATE ON public.student_parent_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();