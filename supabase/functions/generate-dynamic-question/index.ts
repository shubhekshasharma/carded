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
    const { answers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating dynamic question based on:", answers);

    const [name, hobby, quirk, anchor] = answers;

    // Define specific follow-up questions based on anchor item
    const anchorQuestions: Record<string, { question: string; options: string[] }> = {
      "Coffee ☕": {
        question: `Finally — ${name}, since you always have coffee with you… tell me this: Coffee personality check: which one's you?`,
        options: ["Espresso shot ⚡", "Iced latte ❄️", "Black coffee ☕", "Instant coffee 🙃"]
      },
      "Headphones 🎧": {
        question: `Finally — ${name}, since you always have headphones with you… tell me this: What's usually blasting?`,
        options: ["Throwback jams 🎶", "Chaotic mashups 🤪", "Chill lo-fi 🌙", "Latest chart hits 📈"]
      },
      "Backpack 🎒": {
        question: `Finally — ${name}, since you always have your backpack with you… tell me this: What's definitely in there right now?`,
        options: ["Snacks 🍫", "Books 📚", "Laptop 💻", "Random junk 🌀"]
      },
      "Water bottle 💧": {
        question: `Finally — ${name}, since you always have your water bottle with you… tell me this: How do you hydrate?`,
        options: ["Ice cold 💧❄️", "Room temp 🌡️", "With lemon 🍋", "I always forget to drink 🙃"]
      },
      "Snacks 🍫": {
        question: `Finally — ${name}, since you always have snacks with you… tell me this: Snack game check: what's your go-to?`,
        options: ["Chips 🍟", "Candy 🍬", "Fruit 🍎", "Chocolate 🍫"]
      }
    };

    // Check if we have a predefined question for this anchor
    if (anchorQuestions[anchor]) {
      const { question, options } = anchorQuestions[anchor];
      return new Response(
        JSON.stringify({ question, options }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If anchor is custom/freeform, use AI to generate appropriate follow-up
    const prompt = `You're creating a personalized Connection Token quiz question. The user's answers so far:
- Name: ${name}
- Hobby/Obsession: ${hobby}
- Everyday Quirk: ${quirk}
- Personal Anchor (something they always have): ${anchor}

Create a follow-up question that:
1. Addresses them by name: "Finally — ${name}, since you always have [anchor] with you… tell me this:"
2. Asks about their specific usage/preference for that anchor item
3. Provides 4 concrete, specific MCQ options (3-6 words each, use emojis where appropriate)
4. Keep the full question under 20 words total

Examples of the style:
- For "notebook": "Finally — ${name}, since you always have your notebook with you… tell me this: What goes in there?"
  Options: ["Deep thoughts ✍️", "Doodles/sketches 🎨", "To-do lists ✅", "Random notes 📝"]
- For "lip balm": "Finally — ${name}, since you always have lip balm with you… tell me this: How often do you reapply?"
  Options: ["Every 5 minutes 😅", "When I remember 🤔", "Only when desperate 🙃", "Constantly fidgeting 💋"]

Return ONLY a JSON object (no markdown, no code blocks):
{"question": "Finally — ${name}, since you always have [anchor] with you… tell me this: [specific question]", "options": ["option 1", "option 2", "option 3", "option 4"]}`;

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

      throw new Error("Failed to generate dynamic question");
    }

    const data = await response.json();
    console.log("Dynamic question generation successful");

    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("No question generated");
    }

    // Parse the JSON response
    let questionData;
    try {
      questionData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return new Response(
      JSON.stringify(questionData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-dynamic-question:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
