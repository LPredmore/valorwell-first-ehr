
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') || '';
const DAILY_API_URL = 'https://api.daily.co/v1';

interface DailyRoomConfig {
  name?: string;
  properties?: {
    exp?: number;
    enable_screenshare?: boolean;
    start_audio_off?: boolean;
    start_video_off?: boolean;
    enable_chat?: boolean;
  };
}

// CORS headers for the function
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
    console.log('Starting create-daily-room function...');
    
    if (!DAILY_API_KEY || DAILY_API_KEY.trim() === '') {
      console.error('DAILY_API_KEY environment variable is not set or is empty');
      throw new Error('DAILY_API_KEY environment variable is not set or is empty');
    }

    // Parse request body
    const requestData = await req.json().catch(err => {
      console.error('Error parsing request JSON:', err);
      throw new Error('Invalid JSON in request body');
    });
    
    const { config = {} } = requestData as { config: DailyRoomConfig };
    
    // Create a room name if not provided
    if (!config.name) {
      config.name = `room-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    console.log(`Creating Daily.co room with name: ${config.name}`);
    console.log('Room config:', JSON.stringify(config));
    
    // Call Daily.co API to create a room
    console.log('Making request to Daily.co API...');
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify(config)
    });

    const responseText = await response.text();
    console.log(`Daily.co API response status: ${response.status}`);
    console.log(`Daily.co API response body: ${responseText}`);

    if (!response.ok) {
      console.error(`Daily.co API error: ${response.status} ${responseText}`);
      throw new Error(`Failed to create Daily.co room: ${response.status} ${responseText}`);
    }

    const room = JSON.parse(responseText);
    console.log(`Room created successfully: ${room.name}`);

    return new Response(JSON.stringify(room), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-daily-room:', error.message);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack || 'No stack trace available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
