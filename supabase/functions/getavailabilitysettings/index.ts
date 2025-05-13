
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('[getavailabilitysettings] Function called')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
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
          max_days_ahead: 30
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
          max_days_ahead: 30
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`[getavailabilitysettings] Fetching availability settings for clinician ID: ${clinicianId}`);
    
    // Fetch the clinician's availability settings directly from clinicians table
    const { data, error } = await supabaseClient
      .from('clinicians')
      .select('clinician_time_granularity, clinician_min_notice_days, clinician_max_advance_days')
      .eq('id', clinicianId.toString()) // Convert to string explicitly
      .single();
    
    if (error) {
      console.error('[getavailabilitysettings] Database error:', error);
      console.error(`[getavailabilitysettings] Clinician ID used in query: ${clinicianId}`);
      // Return default settings if not found or error
      return new Response(
        JSON.stringify({ 
          time_granularity: 'hour', 
          min_days_ahead: 1,
          max_days_ahead: 30,
          _fallback: true, // Flag to indicate default values were used
          _error: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
  } catch (error) {
    console.error('[getavailabilitysettings] Uncaught error:', error);
    // Always return a valid response with default values even on unexpected errors
    return new Response(
      JSON.stringify({ 
        error: error.message,
        time_granularity: 'hour',
        min_days_ahead: 1,
        max_days_ahead: 30,
        _fallback: true
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
