
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the Daily API key from environment
  const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
  if (!DAILY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'DAILY_API_KEY not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse the request body
    const { appointmentId } = await req.json();
    
    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'Appointment ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create a new room in Daily.co
    const roomName = `appointment-${appointmentId}`;
    
    // Set room properties
    const roomProperties = {
      name: roomName,
      properties: {
        exp: null, // No expiration
        enable_screenshare: false, // No screen sharing
        enable_chat: true, // Enable text chat
        start_video_off: true, // Start with video off
        start_audio_off: false, // Start with audio on
      }
    };
    
    // Make request to Daily.co API
    console.log('Creating Daily.co room:', roomName);
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify(roomProperties)
    });
    
    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Daily.co API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to create Daily.co room', details: data }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Return the room URL
    return new Response(
      JSON.stringify({ url: data.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in create-daily-room function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
