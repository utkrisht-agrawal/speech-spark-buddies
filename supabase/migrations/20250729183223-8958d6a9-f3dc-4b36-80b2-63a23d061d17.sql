-- Allow therapists to view profiles of their assigned students
CREATE POLICY "Therapists can view assigned students profiles"
ON public.profiles
FOR SELECT
USING (
  get_current_user_role() = 'therapist' AND
  EXISTS (
    SELECT 1 FROM public.student_therapist_assignments sta
    WHERE sta.student_id = profiles.user_id
    AND sta.therapist_id = auth.uid()
    AND sta.is_active = true
  )
);