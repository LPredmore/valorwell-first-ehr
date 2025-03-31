
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
      console.error('No clinician ID provided')
      throw new Error('Clinician ID is required')
    }
    
    console.log('Fetching availability settings for clinician ID:', clinicianId)
    
    // Fetch the clinician's availability settings
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', String(clinicianId))
      .single()
    
    if (error) {
      console.error('Error fetching availability settings:', error)
      console.error('Clinician ID used in query:', String(clinicianId))
      
      // Return default settings if not found
      return new Response(
        JSON.stringify({ 
          time_granularity: 'hour',
          min_days_ahead: 1,
          max_days_ahead: 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Successfully retrieved settings:', data)
    
    // Ensure numeric values are returned as numbers, not strings
    const cleanedData = {
      ...data,
      min_days_ahead: parseInt(String(data.min_days_ahead)) || 1,
      max_days_ahead: parseInt(String(data.max_days_ahead)) || 60
    }
    
    console.log('Returning cleaned settings:', cleanedData)
    
    return new Response(
      JSON.stringify(cleanedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        time_granularity: 'hour',
        min_days_ahead: 1,
        max_days_ahead: 60
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
