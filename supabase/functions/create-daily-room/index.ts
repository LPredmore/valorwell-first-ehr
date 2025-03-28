
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
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY environment variable is not set');
    }

    // Parse request body
    const { config = {} } = await req.json() as { config: DailyRoomConfig };
    
    // Create a room name if not provided
    if (!config.name) {
      config.name = `room-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    console.log(`Creating Daily.co room with name: ${config.name}`);
    
    // Call Daily.co API to create a room
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Daily.co API error: ${response.status} ${errorText}`);
      throw new Error(`Failed to create Daily.co room: ${response.status} ${errorText}`);
    }

    const room = await response.json();
    console.log(`Room created successfully: ${room.name}`);

    return new Response(JSON.stringify(room), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-daily-room:', error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
