// Supabase Edge Function: prompt-generator
// POST /prompt-generator - Generate personalized prompts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const Deno: any;

// --- Templates Configuration ---

interface Template {
    id: string;
    role: string; // e.g., 'founder', 'student', 'creative'
    goal: string; // e.g., 'clarity', 'growth', 'decisions'
    style: string; // e.g., 'direct', 'reflective', 'storytelling'
    variations: {
        short: string;
        medium: string;
        long: string;
    };
}

const TEMPLATES: Template[] = [
    {
        id: "founder-growth-direct",
        role: "founder",
        goal: "growth",
        style: "direct",
        variations: {
            short: "Hi {name}, what's the biggest bottleneck you faced today? What's one step to fix it?",
            medium: "Hi {name}. Let's focus on growth. Identify the single biggest bottleneck in your business today. Why does it exist, and what is the immediate next step to remove it?",
            long: "Hi {name}. As a founder, growth is your priority. Take a moment to analyze today's operations. What was the primary bottleneck that slowed you down? Dig deep into the root cause—was it process, people, or product? Now, articulate a clear, actionable plan to eliminate this bottleneck by tomorrow. Your one-line takeaway: {one_line_takeaway}."
        }
    },
    {
        id: "general-clarity-reflective",
        role: "general", // Fallback
        goal: "clarity",
        style: "reflective",
        variations: {
            short: "{name}, take a breath. What is clouding your mind right now? Let it out.",
            medium: "{name}, pause for a moment. What thoughts have been looping in your mind today? Speak them out loud to gain distance and clarity.",
            long: "Hello {name}. Clarity comes from stillness. Close your eyes for a second, then look at the camera. What specific worry or thought has been occupying your mental space today? Describe it in detail. Why does it hold power over you? By speaking it, you release it. Finish with this thought: {one_line_takeaway}."
        }
    },
    // Add more templates as needed
];

const FALLBACK_TEMPLATE: Template = {
    id: "fallback",
    role: "any",
    goal: "any",
    style: "any",
    variations: {
        short: "Hi {name}, what's on your mind today?",
        medium: "Hi {name}, take a moment to reflect. What was the most significant part of your day?",
        long: "Hello {name}. Reflection is a powerful tool. detailed walkthrough of your day. What went well? What could have been better? What did you learn about yourself? End with a key takeaway: {one_line_takeaway}."
    }
};

// --- Helper Functions ---

function generateTeleprompterLines(paragraph: string, wpm: number = 150): string[] {
    // Average words per line for teleprompter (e.g., 3-5 words for readability)
    // But for "lines" in a data structure, we might mean visual lines or time-coded chunks.
    // Here we'll split by sentence or chunks of words for readability.

    const words = paragraph.split(" ");
    const lines: string[] = [];
    let currentLine: string[] = [];

    for (const word of words) {
        currentLine.push(word);
        if (currentLine.length >= 5 || word.endsWith(".") || word.endsWith("?") || word.endsWith("!")) {
            lines.push(currentLine.join(" "));
            currentLine = [];
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine.join(" "));
    }
    return lines;
}

function fillTokens(text: string, data: Record<string, string>): string {
    return text.replace(/{(\w+)}/g, (match, key) => {
        return data[key] || match;
    });
}

// --- Main Handler ---

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

        // 1. Get User Profile
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

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // 2. Determine Context (Role, Goal, Style)
        // Assuming these are stored in onboarding_data or profile fields
        // For MVP, we'll extract from onboarding_data or use defaults
        const onboarding = profile.onboarding_data || {};
        const role = (profile.role || "general").toLowerCase(); // or from onboarding
        const goal = (onboarding.primary_goal || "clarity").toLowerCase();
        const style = (onboarding.style || "reflective").toLowerCase(); // hypothetical field

        // 3. Select Template
        let template = TEMPLATES.find(t =>
            (t.role === role || t.role === "general") &&
            t.goal === goal
        );

        if (!template) {
            template = TEMPLATES.find(t => t.role === "general" && t.goal === goal) || FALLBACK_TEMPLATE;
        }

        // 4. Fill Tokens
        const tokenData = {
            name: profile.full_name || "Friend",
            topic1: "your day", // could be dynamic
            duration_s: "60",
            one_line_takeaway: "I am capable of handling whatever comes next."
        };

        const variations = {
            short: fillTokens(template.variations.short, tokenData),
            medium: fillTokens(template.variations.medium, tokenData),
            long: fillTokens(template.variations.long, tokenData)
        };

        // 5. Generate Teleprompter Lines (for medium variation as default)
        const teleprompterLines = generateTeleprompterLines(variations.medium);

        // 6. Insert into DB (optional, if we want to track history)
        // We'll insert the 'medium' one as the primary prompt for this session
        const { data: savedPrompt, error: insertError } = await supabaseClient
            .from("prompts")
            .insert({
                text: variations.medium,
                category: goal,
                is_active: true,
                // We might want to link this to the user if the schema supported it, 
                // but currently prompts are global. 
                // For personalized prompts, we might need a 'user_prompts' table or just return it ephemeral.
                // The prompt says "Inserts generated prompt into prompts table". 
                // Since prompts table seems global/admin managed in schema, this might pollute it.
                // But I will follow instructions. To avoid pollution, maybe we don't insert or we add a 'user_id' column later.
                // For now, I will skip insertion to avoid polluting the global prompts table with personalized data 
                // unless explicitly required for persistence. 
                // The prompt says "Inserts generated prompt". I'll do it but maybe with a flag or just return it.
                // Actually, looking at the schema, prompts table is simple. 
                // Let's just return the data for the MVP to be safe and fast, 
                // or insert if the user really wants history. 
                // I'll return it.
            })
            .select()
            .single();

        // 7. Return Response
        return new Response(
            JSON.stringify({
                variations,
                teleprompter: {
                    lines: teleprompterLines,
                    wpm: 150,
                    estimated_duration: variations.medium.split(" ").length / (150 / 60)
                },
                meta: {
                    template_id: template.id,
                    role,
                    goal
                }
            }),
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
