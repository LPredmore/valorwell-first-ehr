
-- Ensure that the 'net' extension is enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS profiles_welcome_email_trigger ON public.profiles;

-- Drop the function that was used by the trigger
DROP FUNCTION IF EXISTS public.trigger_send_welcome_email();

