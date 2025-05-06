-- Create an enhanced debugging function to help diagnose client-therapist matching issues
CREATE OR REPLACE FUNCTION public.enhanced_debug_client_therapist(p_therapist_id TEXT)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  therapist_id TEXT,
  therapist_id_type TEXT,
  exact_match BOOLEAN,
  contains_match BOOLEAN,
  email_match BOOLEAN,
  therapist_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_therapist_email TEXT;
BEGIN
  -- Get the therapist's email for comparison
  SELECT clinician_email INTO v_therapist_email
  FROM clinicians
  WHERE id = p_therapist_id::UUID;

  RETURN QUERY
  SELECT 
    c.id AS client_id,
    CONCAT(COALESCE(c.client_first_name, ''), ' ', COALESCE(c.client_last_name, '')) AS client_name,
    c.client_assigned_therapist AS therapist_id,
    pg_typeof(c.client_assigned_therapist)::text AS therapist_id_type,
    -- Check if there's an exact match with the provided therapist ID
    (c.client_assigned_therapist = p_therapist_id) AS exact_match,
    -- Check if the therapist ID is contained within the client_assigned_therapist field
    (c.client_assigned_therapist LIKE '%' || p_therapist_id || '%') AS contains_match,
    -- Check if the therapist's email matches the client_assigned_therapist field
    (c.client_assigned_therapist = v_therapist_email) AS email_match,
    v_therapist_email AS therapist_email
  FROM 
    clients c
  WHERE 
    c.client_assigned_therapist IS NOT NULL
  ORDER BY 
    exact_match DESC, contains_match DESC, email_match DESC, client_name;
END;
$$;

-- Create a function to update client_assigned_therapist to use UUID format
CREATE OR REPLACE FUNCTION public.fix_client_therapist_assignments()
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  old_therapist_id TEXT,
  new_therapist_id TEXT,
  updated BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client RECORD;
  v_clinician_id UUID;
  v_updated BOOLEAN;
BEGIN
  FOR v_client IN 
    SELECT 
      c.id,
      CONCAT(COALESCE(c.client_first_name, ''), ' ', COALESCE(c.client_last_name, '')) AS name,
      c.client_assigned_therapist
    FROM 
      clients c
    WHERE 
      c.client_assigned_therapist IS NOT NULL
  LOOP
    v_updated := FALSE;
    
    -- Try to find clinician by email
    SELECT id INTO v_clinician_id
    FROM clinicians
    WHERE clinician_email = v_client.client_assigned_therapist;
    
    IF v_clinician_id IS NOT NULL THEN
      -- Update client with clinician UUID
      UPDATE clients
      SET client_assigned_therapist = v_clinician_id::TEXT
      WHERE id = v_client.id;
      
      v_updated := TRUE;
    END IF;
    
    client_id := v_client.id;
    client_name := v_client.name;
    old_therapist_id := v_client.client_assigned_therapist;
    new_therapist_id := v_clinician_id::TEXT;
    updated := v_updated;
    
    RETURN NEXT;
  END LOOP;
END;
$$;