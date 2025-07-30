-- Fix OTP expiry to recommended threshold (10 minutes)
UPDATE auth.config 
SET expiry_duration = 600 
WHERE name = 'OTP_EXPIRY_DURATION';

-- Enable leaked password protection
UPDATE auth.config 
SET value = 'true'
WHERE name = 'ENABLE_LEAKED_PASSWORD_PROTECTION';