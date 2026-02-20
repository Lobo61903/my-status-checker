import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get caller IP
    const forwarded = req.headers.get("x-forwarded-for");
    const callerIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all sessions from this IP
    const { data: visits } = await supabase
      .from("visits")
      .select("session_id")
      .eq("ip_address", callerIp);

    if (!visits || visits.length === 0) {
      return new Response(
        JSON.stringify({ consultas: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionIds = visits.map((v) => v.session_id);

    // Find CPFs consulted in those sessions
    const { data: events } = await supabase
      .from("funnel_events")
      .select("cpf, created_at, metadata")
      .in("session_id", sessionIds)
      .eq("event_type", "result_viewed")
      .not("cpf", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    // Deduplicate by CPF, keep most recent
    const seen = new Set<string>();
    const consultas = (events || [])
      .filter((e) => {
        if (!e.cpf || seen.has(e.cpf)) return false;
        seen.add(e.cpf);
        return true;
      })
      .map((e) => ({
        cpf: e.cpf!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4"),
        data: e.created_at,
      }));

    return new Response(
      JSON.stringify({ consultas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ consultas: [], error: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
