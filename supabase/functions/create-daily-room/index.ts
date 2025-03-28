
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

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    
    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const { appointmentId } = await req.json();
    
    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'appointmentId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a unique room name based on the appointment ID
    const roomName = `appointment-${appointmentId}`;

    // Create a room via Daily.co API
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_screenshare: false,
          enable_recording: false,
          exp: null, // No expiration
          max_participants: 2
        }
      })
    });

    const dailyData = await dailyResponse.json();
    
    if (!dailyResponse.ok) {
      console.error('Error creating Daily.co room:', dailyData);
      return new Response(
        JSON.stringify({ error: 'Failed to create video room', details: dailyData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Return the room URL and other details
    return new Response(
      JSON.stringify({ 
        url: dailyData.url,
        name: dailyData.name,
        id: dailyData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-daily-room function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
