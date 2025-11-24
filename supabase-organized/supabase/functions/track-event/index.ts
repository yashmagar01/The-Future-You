// Supabase Edge Function: track-event
// POST /track-event - Server-side event tracking
// Useful for tracking events that shouldn't be client-side (security, reliability)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

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

        // Get authenticated user
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

        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { event_type, payload } = await req.json();

        if (!event_type) {
            return new Response(
                JSON.stringify({ error: "event_type is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Enrich with server-side metadata
        const enrichedPayload = {
            ...payload,
            server_timestamp: new Date().toISOString(),
            ip_address: req.headers.get("x-forwarded-for") || "unknown",
            user_agent: req.headers.get("user-agent"),
        };

        // Insert event
        const { error: insertError } = await supabaseClient
            .from("events_analytics")
            .insert({
                user_id: user.id,
                event_type,
                payload: enrichedPayload,
            });

        if (insertError) throw insertError;

        return new Response(
            JSON.stringify({ success: true }),
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
