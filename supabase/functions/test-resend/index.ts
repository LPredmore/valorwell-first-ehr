
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Parse request body for POST
    const { email }: TestEmailRequest = await req.json();

    console.log(`[test-resend] Sending test email to: ${email}`);

    if (!email || !email.includes("@")) {
      throw new Error("Valid email address is required");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log(`[test-resend] Resend API Key prefix: ${resendKey ? resendKey.substring(0, 5) + "..." : "not set"}`);

    const emailResponse = await resend.emails.send({
      from: "Password Reset <onboarding@resend.dev>",
      to: [email],
      subject: "Test Password Reset Email",
      html: `
        <h1>Test Password Reset Email</h1>
        <p>This is a test email to verify that Resend is configured correctly with Supabase.</p>
        <p>If you're receiving this email, it means that the Resend integration is working.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

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
