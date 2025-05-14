
-- Replace the trigger_send_welcome_email function with a safer version
-- that checks for existence of the http extension before attempting to use it
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url text;
  v_function_url text;
BEGIN
  -- Get the Supabase URL from environment or use a fallback
  BEGIN
    -- Try to get the URL from the database configuration
    SELECT current_setting('app.settings.supabase_url', true) INTO v_supabase_url;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to hardcoded URL if setting not available
    v_supabase_url := 'https://gqlkritspnhjxfejvgfg.supabase.co';
  END;
  
  -- Construct the function URL
  v_function_url := v_supabase_url || '/functions/v1/send-welcome-email';
  
  -- Log the URL being used
  INSERT INTO public.migration_logs (migration_name, description, details)
  VALUES (
    'trigger_send_welcome_email',
    'Attempting to send welcome email',
    jsonb_build_object(
      'profile_id', NEW.id,
      'profile_email', NEW.email,
      'function_url', v_function_url
    )
  );
  
  -- Check if the required extension is available before attempting to use it
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) AND EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    -- Only attempt the HTTP call if the extensions are available
    BEGIN
      PERFORM
        net.http_post(
          url := v_function_url,
          body := json_build_object(
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'record', row_to_json(NEW),
            'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
          )::jsonb,
          headers := '{"Content-Type": "application/json"}'::jsonb
        );
        
      -- Log success
      INSERT INTO public.migration_logs (migration_name, description, details)
      VALUES (
        'trigger_send_welcome_email',
        'Welcome email request sent successfully',
        jsonb_build_object(
          'profile_id', NEW.id,
          'profile_email', NEW.email
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      INSERT INTO public.migration_logs (migration_name, description, details)
      VALUES (
        'trigger_send_welcome_email',
        'Error sending welcome email',
        jsonb_build_object(
          'profile_id', NEW.id,
          'profile_email', NEW.email,
          'error', SQLERRM
        )
      );
    END;
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
