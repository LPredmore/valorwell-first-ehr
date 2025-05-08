
-- Replace the trigger_send_welcome_email function with a safer version
-- that checks for existence of the http extension before attempting to use it
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the required extension is available before attempting to use it
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) AND EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    -- Only attempt the HTTP call if the extensions are available
    PERFORM
      net.http_post(
        url := 'https://gqlkritspnhjxfejvgfg.supabase.co/functions/v1/send-welcome-email',
        body := json_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
        )::jsonb,
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
  ELSE
    -- Log that we couldn't send the welcome email because the extension is missing
    INSERT INTO public.migration_logs (migration_name, description, details)
    VALUES (
      'trigger_send_welcome_email',
      'Could not send welcome email - required extension missing',
      jsonb_build_object(
        'profile_id', NEW.id,
        'profile_email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
CREATE TRIGGER profiles_welcome_email_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_welcome_email();

-- Log the re-enabling of the trigger
INSERT INTO public.migration_logs (migration_name, description, details)
VALUES (
  '20250508_fix_send_welcome_email',
  'Fixed and re-enabled the welcome email trigger',
  jsonb_build_object('action', 're-enable_trigger')
);
