// Supabase Edge Function: generate-prompt
// Supabase Edge Function: generate-prompt
// GET /generate-prompt - Get a reflection prompt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generatePrompts, UserProfile } from "../_shared/promptGenerator.ts";

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

        // Fetch user profile for personalization
        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        // Construct UserProfile object from DB data
        const userProfile: UserProfile = {
            name: profile?.full_name || "Friend",
            role: profile?.role || "any",
            goals: profile?.onboarding_data?.goals || [],
            style: "casual", // Default or fetch from preferences
            topics: [] // Could come from query params or recent events
        };

        // Generate prompts using the shared module
        const prompts = generatePrompts(userProfile);

        return new Response(
            JSON.stringify({
                prompt: {
                    id: "generated",
                    text: prompts.medium, // Default to medium for backward compatibility
                    category: "personalized",
                    variations: prompts
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
