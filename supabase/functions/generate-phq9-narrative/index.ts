
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    // Get the request body
    const { assessment, clientId } = await req.json();
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY') || '';
    
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch client details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('client_first_name, client_last_name')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error('Error fetching client data:', clientError);
      throw new Error('Could not fetch client information');
    }
    
    // Fetch historical PHQ-9 assessments for this client (up to the last 5)
    const { data: historicalAssessments, error: historyError } = await supabase
      .from('phq9_assessments')
      .select('*')
      .eq('client_id', clientId)
      .order('assessment_date', { ascending: false })
      .limit(6); // Get up to 6 (including the current one)
    
    if (historyError) {
      console.error('Error fetching historical assessments:', historyError);
      throw new Error('Could not fetch historical assessment data');
    }
    
    // Filter out the current assessment to get only previous ones
    const previousAssessments = historicalAssessments.filter(
      item => item.id !== assessment.id
    ).slice(0, 5); // Limit to 5 previous assessments
    
    // Get severity description based on total score
    const getSeverity = (score) => {
      if (score >= 0 && score <= 4) return "None-minimal";
      if (score >= 5 && score <= 9) return "Mild";
      if (score >= 10 && score <= 14) return "Moderate";
      if (score >= 15 && score <= 19) return "Moderately severe";
      return "Severe";
    };
    
    // Format assessment data for the AI prompt
    const currentSeverity = getSeverity(assessment.total_score);
    const clientName = `${clientData.client_first_name} ${clientData.client_last_name}`;
    
    // Prepare previous assessment data for trend analysis
    let trendsContext = "No previous assessment data available for comparison.";
    
    if (previousAssessments.length > 0) {
      const scoreHistory = previousAssessments.map(a => ({
        date: a.assessment_date,
        score: a.total_score,
        severity: getSeverity(a.total_score)
      }));
      
      trendsContext = `Previous PHQ-9 scores for comparison:\n` +
        scoreHistory.map(h => `- ${h.date}: Score ${h.score} (${h.severity})`).join('\n');
    }

    // Build the prompt for DeepSeek
    const prompt = `
You are an experienced licensed mental health clinician writing a clinical impression based on a PHQ-9 depression screening.

Client: ${clientName}
Current Date: ${assessment.assessment_date}
Current PHQ-9 Score: ${assessment.total_score} (${currentSeverity})

Individual Question Scores:
1. Little interest or pleasure in doing things: ${assessment.question_1}/3
2. Feeling down, depressed, or hopeless: ${assessment.question_2}/3
3. Trouble falling/staying asleep or sleeping too much: ${assessment.question_3}/3
4. Feeling tired or having little energy: ${assessment.question_4}/3
5. Poor appetite or overeating: ${assessment.question_5}/3
6. Feeling bad about yourself: ${assessment.question_6}/3
7. Trouble concentrating: ${assessment.question_7}/3
8. Moving or speaking slowly/being fidgety or restless: ${assessment.question_8}/3
9. Thoughts of self-harm: ${assessment.question_9}/3

${trendsContext}

Additional Context: ${assessment.additional_notes || "No additional notes provided."}

Write a concise, professional clinical impression paragraph (100-150 words) that:
1. Summarizes the client's current depression severity based on the PHQ-9
2. Notes any significant responses (especially to questions 2 and 9 for mood and safety)
3. Mentions any trends compared to previous assessments (improving, worsening, or stable)
4. Sounds natural, as if written by a clinician after reviewing these scores
5. Uses professional clinical language but avoids excessive jargon
6. Can be directly copied into clinical notes without editing
7. Is written in the third person perspective about the client

The impression should be factual, objective, and based only on the PHQ-9 data provided. Do not include any treatment recommendations or diagnoses.`;

    console.log("Calling DeepSeek API with prompt");
    
    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a clinical psychologist specializing in mental health assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent, professional output
        max_tokens: 500
      })
    });
    
    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API returned error: ${deepseekResponse.status}`);
    }
    
    const aiData = await deepseekResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error('Unexpected DeepSeek API response format:', aiData);
      throw new Error('Unexpected response format from DeepSeek API');
    }
    
    const narrative = aiData.choices[0].message.content.trim();
    console.log("Generated narrative:", narrative);
    
    // Update the assessment with the generated narrative
    const { error: updateError } = await supabase
      .from('phq9_assessments')
      .update({ phq9_narrative: narrative })
      .eq('id', assessment.id);
    
    if (updateError) {
      console.error('Error updating assessment with narrative:', updateError);
      throw new Error('Failed to save narrative to assessment');
    }
    
    // Return the generated narrative
    return new Response(
      JSON.stringify({ success: true, narrative }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in generate-phq9-narrative function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
