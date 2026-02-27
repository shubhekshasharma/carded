import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, obsession, quirk, trophy, vibe } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating fun fact for:", name);

    const prompt = `Create a personalized, hilarious, obviously fake fun fact about ${name} based on these traits:
- Main interest: ${obsession}
- Quirk: ${quirk}
- Always carries: ${trophy}
- Vibe: ${vibe}

CRITICAL RULES:
- Must mention ${name} by name in the fun fact
- Use they/them/their pronouns when referring to ${name}
- Weave together 2-3 of their traits into one cohesive, absurd story
- Must be 20-35 words (slightly longer for personality)
- Must be immediately funny and absurd but feel personal to them
- Must end with an asterisk: *
- Should feel like a ridiculous trading card stat that captures their essence
- Examples of the tone we want:
  * "${name} once mediated a dispute between two houseplants over watering schedules, using only interpretive dance and their coffee as negotiation fuel*"
  * "${name} trained their pet to recognize the sound of their favorite game loading screen from three rooms away*"
  * "${name} has mapped every coffee shop within a 10-mile radius and can identify beans by scent alone while they're half-asleep*"

Return ONLY the fun fact text ending with *, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("Failed to generate fun fact");
    }

    const data = await response.json();
    console.log("Fun fact generation successful");

    const funFact = data.choices?.[0]?.message?.content?.trim();
    
    if (!funFact) {
      throw new Error("No fun fact generated");
    }

    return new Response(
      JSON.stringify({ funFact }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-fun-fact:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
