
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Get the Resend API key with error handling
const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
  console.error("[test-resend] RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Add improved debugging for request headers
    console.log(`[test-resend] Request headers:`, Object.fromEntries([...req.headers.entries()]));
    console.log(`[test-resend] Content-Type:`, req.headers.get('content-type'));
    
    // For GET requests, return simple status
    if (req.method === "GET") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Test Resend edge function is running",
          hasResendKey: !!resendKey,
          keyPrefix: resendKey ? resendKey.substring(0, 5) + "..." : "not set"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse and validate request body
    let email: string;
    let bodyText: string;
    
    try {
      bodyText = await req.text();
      console.log(`[test-resend] Raw request body: ${bodyText}`);
      
      // First try to parse as JSON
      try {
        const body = JSON.parse(bodyText);
        email = body.email;
        
        // If email is missing in JSON, log this specific issue
        if (!email) {
          console.warn("[test-resend] Email field missing from JSON body:", body);
        }
      } catch (jsonError) {
        // If JSON parsing fails, try to extract email from URL-encoded form data
        if (bodyText.includes('email=')) {
          const params = new URLSearchParams(bodyText);
          email = params.get('email');
          console.log(`[test-resend] Extracted email from form data: ${email}`);
        } else {
          throw new Error(`Invalid request format: ${jsonError.message}`);
        }
      }
      
      // If still no email, this is an error
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Email parameter is required",
            receivedBody: bodyText.substring(0, 100) // Truncate for safety
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      console.log(`[test-resend] Parsed email from request: ${email}`);
    } catch (parseError) {
      console.error(`[test-resend] Failed to parse request: ${parseError.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format: " + parseError.message,
          receivedData: bodyText.substring(0, 100) // Truncate for safety
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes("@")) {
      console.error(`[test-resend] Invalid email provided: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Valid email address is required",
          receivedValue: email 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`[test-resend] Sending test email to: ${email}`);

    // Check if Resend API key is available
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY environment variable is not set",
          message: "Email delivery is not configured properly. Please set the RESEND_API_KEY environment variable."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`[test-resend] Resend API Key prefix: ${resendApiKey.substring(0, 5) + "..."}`);

    // Send the email with better error handling
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: "Valorwell EHR <noreply@valorwell.com>",
        to: [email],
        subject: "Test Password Reset Email",
        html: `
          <h1>Test Password Reset Email</h1>
          <p>This is a test email to verify that Resend is configured correctly with Supabase.</p>
          <p>If you're receiving this email, it means that the Resend integration is working.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
      });
    
      if (!emailResponse || !emailResponse.id) {
        throw new Error("Failed to send email: No response ID received");
      }
    } catch (emailError) {
      console.error(`[test-resend] Email sending error:`, emailError);
      return new Response(
        JSON.stringify({
          success: false,
          error: emailError.message,
          details: "Failed to send email through Resend API"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`[test-resend] Email response:`, emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test email sent successfully",
        data: emailResponse
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(`[test-resend] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
