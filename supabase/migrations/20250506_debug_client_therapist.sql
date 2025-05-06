
-- Create a database function to help debug client-therapist matching
CREATE OR REPLACE FUNCTION public.debug_client_therapist_matching(p_therapist_id TEXT)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  therapist_id TEXT,
  therapist_id_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS client_id,
    CONCAT(COALESCE(c.client_first_name, ''), ' ', COALESCE(c.client_last_name, '')) AS client_name,
    c.client_assigned_therapist AS therapist_id,
    pg_typeof(c.client_assigned_therapist)::text AS therapist_id_type
  FROM 
    clients c
  WHERE 
    c.client_assigned_therapist IS NOT NULL
  ORDER BY 
    client_name;
END;
$$;
