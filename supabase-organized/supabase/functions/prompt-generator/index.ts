// Supabase Edge Function: prompt-generator
// POST /prompt-generator - Generate personalized scripts using Gemini API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const Deno: any;

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: { headers: { Authorization: req.headers.get("Authorization")! } },
            }
        );

        // 1. Verify Auth
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Parse Input
        const input = await req.json();
        
        // Map frontend onboarding data to prompt variables
        const profileData = {
            name: input.full_name || "Friend",
            style: input.reflection_style || input.style || "conversational",
            goal: input.primary_goal || "self-improvement",
            focus_areas: Array.isArray(input.focus_areas) ? input.focus_areas.join(", ") : (input.focus_areas || "general reflection"),
            experience_level: input.experience_level || "intermediate",
            duration_short: 1,
            duration_medium: 3,
            duration_long: 5
        };

        // Calculate target word counts (approx 130 wpm)
        const wordsShort = 130 * profileData.duration_short;
        const wordsMedium = 130 * profileData.duration_medium;
        const wordsLong = 130 * profileData.duration_long;

        // 3. Construct System Prompt
        const systemPrompt = `
You are an expert speech coach and scriptwriter for the Yash MVP (AI self-coaching video app).
Your goal is to write a personalized, engaging script for the user to read aloud on camera.

User Profile:
- Style: ${profileData.style}
- Primary Goal: ${profileData.goal}
- Focus Areas: ${profileData.focus_areas}
- Experience Level: ${profileData.experience_level}

Task:
Generate 3 variants of a script based on the user's goal and focus areas.
The scripts must be SUBSTANTIAL and meet the following length requirements:

1. SHORT (~${wordsShort} words): A quick check-in or focused thought.
2. MEDIUM (~${wordsMedium} words): A deeper reflection or story.
3. LONG (~${wordsLong} words): A comprehensive exploration of the topic.

Guidelines:
- STRICTLY follow the word counts. Do not write short summaries. Write the FULL spoken text.
- Use a ${profileData.style} tone.
- Address the user directly.
- Include specific questions or prompts related to "${profileData.focus_areas}" to guide their reflection.
- Break the text into natural speaking chunks with line breaks.
- Output MUST be valid JSON with this exact structure:
{
  "variations": {
    "short": "full script text...",
    "medium": "full script text...",
    "long": "full script text..."
  }
}
`;

        // 4. Call Gemini API
        const geminiKey = Deno.env.get("GEMINI_API_KEY");
        if (!geminiKey) {
            throw new Error("Missing GEMINI_API_KEY");
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: JSON.stringify(profileData) }]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API Error: ${errorData}`);
        }

        const aiData = await response.json();
        
        // Parse Gemini response
        // Gemini returns candidates[0].content.parts[0].text
        const textResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
            throw new Error("No content generated from Gemini");
        }

        const generatedContent = JSON.parse(textResponse);

        // 5. Return Result
        return new Response(
            JSON.stringify(generatedContent),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

