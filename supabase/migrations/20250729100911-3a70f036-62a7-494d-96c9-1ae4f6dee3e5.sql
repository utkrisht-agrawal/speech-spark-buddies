-- Add RLS policies for admins to manage student-therapist assignments
CREATE POLICY "Admins can manage all therapist assignments"
ON public.student_therapist_assignments
FOR ALL
USING (get_current_user_role() = 'admin');

-- Add RLS policies for admins to manage student-parent assignments  
CREATE POLICY "Admins can manage all parent assignments"
ON public.student_parent_assignments
FOR ALL
USING (get_current_user_role() = 'admin');