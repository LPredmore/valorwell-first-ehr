
-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the new handle_new_user function with proper logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role text;
BEGIN
  -- Extract the role from user metadata
  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Validate the role
  IF v_role IS NULL OR v_role NOT IN ('admin', 'clinician', 'client') THEN
    -- Log the issue and exit without creating a row in role tables
    INSERT INTO public.migration_logs (
      migration_name, 
      description, 
      details
    ) VALUES (
      'handle_new_user_trigger',
      'User created with missing or invalid role',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'provided_role', v_role,
        'raw_metadata', NEW.raw_user_meta_data
      )
    );
    
    -- Return the record without inserting into role tables
    RETURN NEW;
  END IF;
  
  -- Handle role-specific logic
  IF v_role = 'admin' THEN
    -- For admin role, insert into admins table
    INSERT INTO public.admins (
      id,
      admin_email,
      admin_first_name,
      admin_last_name,
      admin_phone
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone'
    );
    
    -- Log successful admin creation
    INSERT INTO public.migration_logs (
      migration_name, 
      description, 
      details
    ) VALUES (
      'handle_new_user_trigger',
      'Admin user created successfully',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email
      )
    );
    
  ELSIF v_role = 'clinician' THEN
    -- For clinician role, insert into clinicians table
    INSERT INTO public.clinicians (
      id,
      clinician_email,
      clinician_first_name,
      clinician_last_name,
      clinician_phone,
      clinician_status
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      'New'
    );
    
    -- Log successful clinician creation
    INSERT INTO public.migration_logs (
      migration_name, 
      description, 
      details
    ) VALUES (
      'handle_new_user_trigger',
      'Clinician user created successfully',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email
      )
    );
    
  ELSIF v_role = 'client' THEN
    -- For client role, insert into clients table
    INSERT INTO public.clients (
      id,
      client_email,
      client_first_name,
      client_last_name,
      client_phone,
      role,
      client_state,
      client_status,
      client_temppassword
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      'client'::app_role,
      NEW.raw_user_meta_data->>'state',
      'New',
      NEW.raw_user_meta_data->>'temp_password'
    );
    
    -- Log successful client creation
    INSERT INTO public.migration_logs (
      migration_name, 
      description, 
      details
    ) VALUES (
      'handle_new_user_trigger',
      'Client user created successfully',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Log the creation of the new trigger
INSERT INTO public.migration_logs (migration_name, description, details)
VALUES (
  '20250508_update_handle_new_user',
  'Updated handle_new_user function and trigger',
  jsonb_build_object('action', 'update_trigger')
);
