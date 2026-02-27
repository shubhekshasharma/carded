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
    const { prompt: userPrompt } = await req.json();
    
    // Build final prompt by reinforcing constraints and keeping the client's intent
    const base = (userPrompt ?? '').trim();
    const prompt = `${base}\n\nStrict requirements:\n- Create a gender‑neutral character (avoid gendered cues).\n- No text or letters anywhere in the image.\n- Only include props explicitly mentioned in the prompt. If none are mentioned, keep hands empty and do not invent props.\n- Allowed props mapping (use at most 1–2):\n  • Plants → leafy plants nearby or a small potted plant\n  • Music/Headphones → retro headphones\n  • Coffee → a small coffee mug\n  • Gaming → a small game controller\n  • Art → a paintbrush or sketchbook\n  • Cooking → a chef hat or cooking utensil\n  • Sports → appropriate sports equipment\n- Do NOT include plants unless 'plants' is present.\n- Style: cartoon/illustrated or tasteful pixel art; modern‑retro; centered portrait; flat colors or soft shading; colorful, friendly; simple background.`;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating avatar with enhanced prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
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

      throw new Error("Failed to generate avatar");
    }

    const data = await response.json();
    console.log("Avatar generation successful");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-avatar:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
