
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    const { clinicianId } = await req.json()
    
    if (!clinicianId) {
      throw new Error('Clinician ID is required')
    }
    
    // Fetch the clinician's availability settings
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId.toString()) // Convert to string explicitly
      .single()
    
    if (error) {
      console.error('Error fetching availability settings:', error)
      // Return default settings if not found - updated defaults
      return new Response(
        JSON.stringify({ time_granularity: 'hour', min_days_ahead: 2, max_days_ahead: 60 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
