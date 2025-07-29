-- Add INSERT policy for admins on student-therapist assignments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_therapist_assignments' 
        AND policyname = 'Admins can insert therapist assignments'
    ) THEN
        CREATE POLICY "Admins can insert therapist assignments"
        ON public.student_therapist_assignments
        FOR INSERT
        WITH CHECK (get_current_user_role() = 'admin');
    END IF;
END $$;

-- Add INSERT policy for admins on student-parent assignments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_parent_assignments' 
        AND policyname = 'Admins can insert parent assignments'
    ) THEN
        CREATE POLICY "Admins can insert parent assignments"
        ON public.student_parent_assignments
        FOR INSERT
        WITH CHECK (get_current_user_role() = 'admin');
    END IF;
END $$;