
-- Create app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'clinician', 'client');
    
    -- Log creation
    INSERT INTO public.migration_logs (migration_name, description, details)
    VALUES (
      '20250508_ensure_app_role',
      'Created app_role enum type',
      jsonb_build_object('action', 'create_type')
    );
  ELSE
    -- Log verification
    INSERT INTO public.migration_logs (migration_name, description, details)
    VALUES (
      '20250508_ensure_app_role',
      'Verified app_role enum type exists',
      jsonb_build_object('action', 'verify_type')
    );
  END IF;
END$$;
