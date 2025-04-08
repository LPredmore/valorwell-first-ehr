
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("Edge function started: update-clinician-license-types");
    
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Execute SQL to drop the existing check constraint
    console.log("Dropping existing constraint...");
    const { error: dropError } = await supabaseClient.rpc("exec_sql", {
      sql: "ALTER TABLE clinicians DROP CONSTRAINT IF EXISTS clinicians_license_type_check"
    });
    
    if (dropError) {
      console.error("Error dropping constraint:", dropError);
      return new Response(JSON.stringify({ success: false, error: dropError }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      });
    }
    
    // Add new check constraint with updated license types
    const licenseTypes = ["LPC", "LMHC", "LCPC", "LPC-MH", "LPCC", "LCSW", "LMFT", "PsyD"];
    const licenseTypesList = licenseTypes.map(type => `'${type}'`).join(", ");
    
    console.log(`Adding new constraint with types: ${licenseTypesList}`);
    const { error: addError } = await supabaseClient.rpc("exec_sql", {
      sql: `ALTER TABLE clinicians ADD CONSTRAINT clinicians_license_type_check CHECK (clinician_license_type IN (${licenseTypesList}))`
    });
    
    if (addError) {
      console.error("Error adding constraint:", addError);
      return new Response(JSON.stringify({ success: false, error: addError }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      });
    }
    
    console.log("Constraint updated successfully");
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Clinician license types constraint updated successfully",
      licenseTypes
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
});
