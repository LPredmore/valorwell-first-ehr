
-- Function to create or replace the check_table_exists function with qualified column names
CREATE OR REPLACE FUNCTION public.create_or_replace_check_table_exists_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop the existing function if it exists
  DROP FUNCTION IF EXISTS public.check_table_exists;

  -- Create the fixed function with qualified column name
  EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.check_table_exists(check_table_name text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $INNER_FUNC$
    BEGIN
      RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND information_schema.tables.table_name = check_table_name
      );
    END;
    $INNER_FUNC$;
  $FUNC$;
END;
$$;

-- Execute the function to create the fixed check_table_exists function
SELECT public.create_or_replace_check_table_exists_function();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_replace_check_table_exists_function() TO authenticated;

-- Clean up (optional: remove the helper function if not needed for future use)
-- DROP FUNCTION IF EXISTS public.create_or_replace_check_table_exists_function();
