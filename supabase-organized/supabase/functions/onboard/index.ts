// Supabase Edge Function: onboard
// POST /onboard - Save onboarding data
// GET /onboard?userId=... - Get user profile

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const Deno: any;

serve(async (req: Request) => {
    // Handle CORS preflight
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

        // Verify user is authenticated
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

        const url = new URL(req.url);

        // GET - Get user profile
        if (req.method === "GET") {
            const userId = url.searchParams.get("userId") || user.id;

            // Only allow users to view their own profile unless admin
            if (userId !== user.id) {
                // Check if admin (optional, for now strict)
                // For MVP, just restrict to own profile
                return new Response(
                    JSON.stringify({ error: "Forbidden" }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const { data: profile, error } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) throw error;

            return new Response(
                JSON.stringify({ profile }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // POST - Save onboarding data
        if (req.method === "POST") {
            const body = await req.json();
            const { onboarding_data, full_name } = body;

            const updates: any = {
                updated_at: new Date(),
            };

            if (onboarding_data) updates.onboarding_data = onboarding_data;
            if (full_name) updates.full_name = full_name;

            const { data, error } = await supabaseClient
                .from("profiles")
                .update(updates)
                .eq("id", user.id)
                .select()
                .single();

            if (error) throw error;

            return new Response(
                JSON.stringify({ success: true, profile: data }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
