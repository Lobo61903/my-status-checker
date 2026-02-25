import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://my-status-checker.lovable.app',
  'https://id-preview--01e93b99-5c41-441e-b33b-75968963ece1.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.lovable.app'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 15; // 15 req/min
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') || 'unknown';
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const ip = getClientIp(req);
    if (!checkRate(ip)) {
      return new Response(JSON.stringify({ consultas: [], error: 'rate_limit' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find sessions from this IP
    const { data: visits } = await supabase
      .from('visits')
      .select('session_id')
      .eq('ip_address', ip)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!visits || visits.length === 0) {
      return new Response(
        JSON.stringify({ consultas: [] }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const sessionIds = visits.map((v) => v.session_id);

    const { data: events } = await supabase
      .from('funnel_events')
      .select('cpf, created_at, metadata')
      .in('session_id', sessionIds)
      .eq('event_type', 'result_viewed')
      .not('cpf', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const seen = new Set<string>();
    const consultas = (events || [])
      .filter((e) => {
        if (!e.cpf || seen.has(e.cpf)) return false;
        seen.add(e.cpf);
        return true;
      })
      .map((e) => ({
        cpf: e.cpf!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4'),
        data: e.created_at,
      }));

    return new Response(
      JSON.stringify({ consultas }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ consultas: [], error: 'internal' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
