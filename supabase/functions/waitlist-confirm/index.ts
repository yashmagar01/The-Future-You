// Supabase Edge Function: waitlist-confirm
// POST /api/waitlist/confirm - Confirm email with token

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_EXPIRY_DAYS = 7;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role for update
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find entry by token
    const { data: entry, error: fetchError } = await supabaseClient
      .from("waitlist_entries")
      .select("*")
      .eq("confirm_token", token)
      .single();

    if (fetchError || !entry) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired confirmation token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already confirmed
    if (entry.status === "confirmed") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email already confirmed",
          entry: {
            id: entry.id,
            email: entry.email,
            status: entry.status,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired (7 days)
    const createdAt = new Date(entry.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > TOKEN_EXPIRY_DAYS) {
      return new Response(
        JSON.stringify({ error: "Confirmation token has expired. Please sign up again." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to confirmed and clear token
    const { data: updated, error: updateError } = await supabaseClient
      .from("waitlist_entries")
      .update({
        status: "confirmed",
        confirm_token: null,
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email confirmed successfully",
        entry: {
          id: updated.id,
          email: updated.email,
          status: updated.status,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Confirmation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to confirm email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
