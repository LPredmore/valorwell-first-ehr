
-- Create a function that sends a webhook to our edge function
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the profiles table
DROP TRIGGER IF EXISTS profiles_welcome_email_trigger ON public.profiles;
CREATE TRIGGER profiles_welcome_email_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_welcome_email();
