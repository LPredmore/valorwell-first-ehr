
-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS profiles_welcome_email_trigger ON public.profiles;

-- Log this action to migration_logs
INSERT INTO public.migration_logs (migration_name, description, details)
VALUES (
  '20250508_fix_welcome_email_trigger',
  'Temporarily disabled profiles_welcome_email_trigger',
  jsonb_build_object('action', 'disable_trigger')
);
