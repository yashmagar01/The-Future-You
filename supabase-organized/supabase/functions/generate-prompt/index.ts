// Supabase Edge Function: generate-prompt
// Supabase Edge Function: generate-prompt
// GET /generate-prompt - Get a reflection prompt

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

        // Fetch active prompts
        const { data: prompts, error } = await supabaseClient
            .from("prompts")
            .select("*")
            .eq("is_active", true);

        if (error) throw error;

        if (!prompts || prompts.length === 0) {
            // Fallback prompt if no active prompts in DB
            return new Response(
                JSON.stringify({
                    prompt: {
                        id: "default",
                        text: "What is one thing you learned about yourself today?",
                        category: "daily"
                    }
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Randomly select a prompt
        // TODO: Implement smarter selection logic based on user history
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        return new Response(
            JSON.stringify({ prompt: randomPrompt }),
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
