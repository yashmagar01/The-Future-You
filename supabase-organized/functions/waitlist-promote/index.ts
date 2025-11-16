// Supabase Edge Function: waitlist-promote
// POST /api/waitlist/promote - Promote user to tester (admin only)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { email, userId, promoteTo = "tester" } = await req.json();

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: "Email or userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find waitlist entry
    let query = supabaseClient.from("waitlist_entries").select("*");
    
    if (email) {
      query = query.eq("email", email);
    } else {
      query = query.eq("id", userId);
    }

    const { data: entry, error: fetchError } = await query.single();

    if (fetchError || !entry) {
      return new Response(
        JSON.stringify({ error: "Waitlist entry not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already promoted
    if (entry.status === "promoted") {
      return new Response(
        JSON.stringify({ error: "User already promoted" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email is confirmed
    if (entry.status !== "confirmed") {
      return new Response(
        JSON.stringify({ error: "User must confirm email before promotion" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update waitlist entry status
    const { error: updateError } = await supabaseClient
      .from("waitlist_entries")
      .update({ status: "promoted" })
      .eq("id", entry.id);

    if (updateError) {
      throw updateError;
    }

    // Create promotion record
    const { error: promoError } = await supabaseClient
      .from("promotions")
      .insert({
        waitlist_id: entry.id,
        admin_id: user.id,
        promoted_to: promoteTo,
      });

    if (promoError) {
      console.error("Promotion record error:", promoError);
      // Continue even if audit log fails
    }

    // Check if user already has an account
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUser?.users?.some((u: any) => u.email === entry.email);

    if (userExists) {
      // Update existing user's profile
      const { data: existingProfile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", entry.email)
        .single();

      if (existingProfile) {
        await supabaseClient
          .from("profiles")
          .update({ role: promoteTo })
          .eq("id", existingProfile.id);
      }
    }

    // Send promotion email (call email edge function)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          type: "promotion",
          to: entry.email,
          name: entry.name || null,
        }),
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User promoted to ${promoteTo} successfully`,
        entry: {
          id: entry.id,
          email: entry.email,
          status: "promoted",
          promoted_to: promoteTo,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Promotion error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to promote user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
