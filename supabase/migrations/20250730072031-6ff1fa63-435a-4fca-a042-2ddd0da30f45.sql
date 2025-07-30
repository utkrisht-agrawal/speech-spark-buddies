-- Add expires_at field to exercise_assignments table for timer functionality
ALTER TABLE exercise_assignments 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of active assignments
CREATE INDEX idx_exercise_assignments_expires_at ON exercise_assignments(expires_at) WHERE is_active = true;

-- Update existing assignments to expire in 24 hours from assignment
UPDATE exercise_assignments 
SET expires_at = created_at + INTERVAL '1 day' 
WHERE expires_at IS NULL AND is_active = true;