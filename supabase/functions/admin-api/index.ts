
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers,
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    
    if (verifyError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Extract the request path and parameters
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Parse the request body
    const body = await req.json();

    if (path === 'create-user') {
      const { email, password, firstName, lastName, phone, role } = body;
      
      // Create the user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          first_name: firstName,
          last_name: lastName,
          role: role || 'client'
        }
      });

      if (error) {
        throw error;
      }

      // Update the phone number if provided
      if (phone && data.user) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ phone })
          .eq('id', data.user.id);
          
        if (updateError) {
          throw updateError;
        }
      }

      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      });
    } 
    else if (path === 'delete-user') {
      const { userId } = body;

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
