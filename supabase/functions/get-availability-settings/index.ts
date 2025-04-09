
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
    
    // Check if clinician ID matches auth user ID format for debugging
    const isClinicianIdInUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicianId);
    console.log(`Is clinician ID (${clinicianId}) in UUID format? ${isClinicianIdInUuidFormat}`);
    
    // Fetch the clinician's availability settings
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId.toString()) // Convert to string explicitly
      .single()
    
    if (error) {
      console.error('Error fetching availability settings:', error)
      console.error(`Clinician ID used in query: ${clinicianId}`)
      // Return updated defaults with 8:00-16:00 time slots and 3 days ahead
      return new Response(
        JSON.stringify({ 
          time_granularity: 'hour', 
          min_days_ahead: 3,  // Updated from 2 to 3
          max_days_ahead: 60,
          default_start_time: '08:00', // Added default start time
          default_end_time: '16:00'    // Added default end time
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ensure min_days_ahead and max_days_ahead are numbers and provide defaults for missing fields
    if (data) {
      data.min_days_ahead = Number(data.min_days_ahead || 3);  // Default to 3 days if not set
      data.max_days_ahead = Number(data.max_days_ahead || 60); // Default to 60 days if not set
      
      // Add default times if not present in the data
      data.default_start_time = data.default_start_time || '08:00';
      data.default_end_time = data.default_end_time || '16:00';
      
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
