
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
    
    console.log(`Fetching availability settings for clinician ID: ${clinicianId}`)
    console.log(`Clinician ID type: ${typeof clinicianId}`)
    
    // Fetch the clinician's availability settings without any type conversion
    // Let Supabase handle the matching appropriately
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .single()
    
    if (error) {
      console.error('Error fetching availability settings:', error)
      console.error(`Clinician ID used in query: ${clinicianId}`)
      
      // Instead of returning defaults, return the error to make problems visible
      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: 'Failed to fetch availability settings'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Ensure min_days_ahead is a number
    if (data) {
      data.min_days_ahead = Number(data.min_days_ahead) || 2; // Default to 2 if falsy
      data.max_days_ahead = Number(data.max_days_ahead) || 60; // Default to 60 if falsy
      console.log(`Successfully retrieved settings: ${JSON.stringify(data, null, 2)}`)
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
