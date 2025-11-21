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
        
        // Default values if missing
        const profileData = {
            name: input.name || "Friend",
            role: input.role || "student",
            style: input.style || "clear",
            topic1: input.topic1 || "general reflection",
            topic2: input.topic2 || "",
            topic3: input.topic3 || "",
            duration_min_short: input.duration_min_short || 1,
            duration_min_medium: input.duration_min_medium || 3,
            duration_min_long: input.duration_min_long || 7,
            prompt_type: input.prompt_type || "script",
            camera_comfort: input.camera_comfort || "neutral",
            example: input.example || "",
            achievement: input.achievement || "",
            one_line_memory: input.one_line_memory || "",
            language: input.language || "English"
        };

        // 3. Construct System Prompt
        const systemPrompt = `
You are generating read-aloud scripts for the Yash MVP (AI self-coaching video app).
Task:
Given the user profile tokens in INPUT, generate 3 variants of a script the user can read on camera:
- short (≈130 words per minute × ${profileData.duration_min_short})
- medium (≈130 wpm × ${profileData.duration_min_medium})
- long (≈130 wpm × ${profileData.duration_min_long})

Make each variant:
- natural spoken style for the user's chosen style: ${profileData.style}
- include \`(pause)\` tokens every 25–40 words
- include one 1-line exam-friendly takeaway at the end if user.role == "student" or if one_line_memory is provided
- use the user's example and achievement concretely when present
- keep formatting as plain text with line breaks every ~10–14 words (for teleprompter readability)
- output JSON: { "short": "...", "medium":"...", "long":"...", "meta": { "short_words": number, "medium_words": number, "long_words": number } }
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

