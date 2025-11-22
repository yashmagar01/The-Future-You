// Supabase Edge Function: waitlist
// POST /api/waitlist - Join waitlist
// GET /api/waitlist - List entries (admin only)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple rate limiting (in-memory for MVP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms
const MAX_REQUESTS = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateConfirmToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // GET - List waitlist entries (admin only)
    if (req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify admin role
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

      // Parse query params
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search");

      let query = supabaseClient
        .from("waitlist_entries")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({
          entries: data,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil((count || 0) / limit),
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - Join waitlist
    if (req.method === "POST") {
      // Rate limiting
      if (!checkRateLimit(clientIp)) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { email, name, phone, role_interest, message, referrer, source, honeypot } = body;

      // Honeypot check
      if (honeypot) {
        return new Response(
          JSON.stringify({ error: "Invalid submission" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate required fields
      if (!email || !role_interest) {
        return new Response(
          JSON.stringify({ error: "Email and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate email format
      if (!validateEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if email already exists
      const { data: existing } = await supabaseClient
        .from("waitlist_entries")
        .select("id, status")
        .eq("email", email)
        .single();

      if (existing) {
        if (existing.status === "confirmed") {
          return new Response(
            JSON.stringify({ error: "This email is already confirmed on the waitlist" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              error: "This email is already on the waitlist. Please check your email for the confirmation link.",
              message: "Check your email"
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate confirmation token
      const confirmToken = generateConfirmToken();

      // Insert waitlist entry
      const { data: entry, error: insertError } = await supabaseClient
        .from("waitlist_entries")
        .insert({
          email,
          name: name || null,
          phone: phone || null,
          role_interest,
          message: message || null,
          referrer: referrer || null,
          source: source || null,
          status: "pending",
          confirm_token: confirmToken,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to join waitlist");
      }

      // Send confirmation email (call email edge function)
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            type: "confirmation",
            to: email,
            name: name || null,
            confirmToken,
          }),
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the request if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully joined waitlist. Please check your email to confirm.",
          entry: {
            id: entry.id,
            email: entry.email,
            status: entry.status,
          },
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
