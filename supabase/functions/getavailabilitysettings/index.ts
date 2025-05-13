
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[getavailabilitysettings] Handling OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[getavailabilitysettings] Function called with method:', req.method);
    
    // Log authentication details - important for debugging auth issues
    const authHeader = req.headers.get('Authorization');
    console.log('[getavailabilitysettings] Authorization header present:', !!authHeader);
    if (authHeader) {
      // Log a truncated version of the auth header for debugging (don't log the full token for security)
      const truncatedAuth = authHeader.substring(0, 20) + '...' + authHeader.substring(authHeader.length - 10);
      console.log('[getavailabilitysettings] Auth header (truncated):', truncatedAuth);
    } else {
      console.error('[getavailabilitysettings] No Authorization header provided - this will cause authentication failures');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[getavailabilitysettings] Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      });
      throw new Error('Missing Supabase configuration');
    }
    
    console.log('[getavailabilitysettings] Supabase URL available:', !!supabaseUrl);
    console.log('[getavailabilitysettings] Supabase Anon Key available:', !!supabaseAnonKey);
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('[getavailabilitysettings] Request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('[getavailabilitysettings] Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body', 
          // Return default values even on error
          time_granularity: 'hour',
          min_days_ahead: 1,
          max_days_ahead: 30,
          _error_type: 'parse_error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { clinicianId } = requestBody;
    
    if (!clinicianId) {
      console.error('[getavailabilitysettings] No clinicianId provided');
      return new Response(
        JSON.stringify({ 
          error: 'Clinician ID is required',
          // Return default values even when parameter is missing
          time_granularity: 'hour',
          min_days_ahead: 1,
          max_days_ahead: 30,
          _error_type: 'missing_clinician_id'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`[getavailabilitysettings] Fetching availability settings for clinician ID: ${clinicianId}`);
    console.log(`[getavailabilitysettings] Type of clinicianId: ${typeof clinicianId}`);
    
    try {
      // Verify authentication first
      try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError) {
          console.error('[getavailabilitysettings] Authentication error:', authError);
          return new Response(
            JSON.stringify({ 
              time_granularity: 'hour', 
              min_days_ahead: 1,
              max_days_ahead: 30,
              _fallback: true,
              _error_type: 'auth_error',
              _error: authError.message
            }),
            { 
              status: 200, // Still return 200 with defaults for backwards compatibility
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        console.log('[getavailabilitysettings] Authenticated user:', user?.id);
      } catch (authCheckError) {
        console.error('[getavailabilitysettings] Error checking authentication:', authCheckError);
        // Continue with the request even if auth check fails
      }
      
      // Fetch the clinician's availability settings directly from clinicians table
      const { data, error } = await supabaseClient
        .from('clinicians')
        .select('clinician_time_granularity, clinician_min_notice_days, clinician_max_advance_days')
        .eq('id', clinicianId.toString()) // Convert to string explicitly
        .single();
      
      console.log('[getavailabilitysettings] Database query executed');
      
      if (error) {
        console.error('[getavailabilitysettings] Database error:', error);
        console.error(`[getavailabilitysettings] Clinician ID used in query: ${clinicianId}`);
        // Return default settings if not found or error
        return new Response(
          JSON.stringify({ 
            time_granularity: 'hour', 
            min_days_ahead: 1,
            max_days_ahead: 30,
            _fallback: true,
            _error_type: 'database_error',
            _error: error.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[getavailabilitysettings] Query results:', JSON.stringify(data));
      
      // Map clinician table columns to the expected response format
      // With explicit type handling and defaults for all values
      const settings = {
        time_granularity: typeof data.clinician_time_granularity === 'string' ? data.clinician_time_granularity : 'hour',
        min_days_ahead: Number(data.clinician_min_notice_days) || 1,
        max_days_ahead: Number(data.clinician_max_advance_days) || 30
      };
      
      console.log(`[getavailabilitysettings] Successfully retrieved settings: ${JSON.stringify(settings, null, 2)}`);
      
      return new Response(
        JSON.stringify(settings),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('[getavailabilitysettings] Database operation error:', dbError);
      // Return default settings if database operation failed
      return new Response(
        JSON.stringify({ 
          time_granularity: 'hour', 
          min_days_ahead: 1,
          max_days_ahead: 30,
          _fallback: true,
          _error_type: 'operation_error',
          _error: dbError instanceof Error ? dbError.message : String(dbError)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[getavailabilitysettings] Uncaught error:', error);
    // Always return a valid response with default values even on unexpected errors
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        time_granularity: 'hour',
        min_days_ahead: 1,
        max_days_ahead: 30,
        _fallback: true,
        _error_type: 'uncaught_error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
