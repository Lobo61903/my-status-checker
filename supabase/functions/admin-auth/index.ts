const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function toB64(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

async function createToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = toB64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toB64(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  const signature = toB64(String.fromCharCode(...new Uint8Array(sig)));
  return `${header}.${body}.${signature}`;
}

async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(fromB64(signature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(fromB64(body));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    console.error('Token verify error:', e);
    return null;
  }
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const tokenSecret = serviceKey.substring(0, 32);
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action } = body;

    // LOGIN
    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) {
        return jsonResponse({ error: 'Credenciais obrigatórias' }, 400);
      }

      const { data: user, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password,
      });

      if (error || !user || user.length === 0) {
        return jsonResponse({ error: 'Credenciais inválidas' }, 401);
      }

      const adminUser = user[0];
      await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminUser.id);

      const token = await createToken({ sub: adminUser.id, username: adminUser.username, name: adminUser.display_name }, tokenSecret);

      return jsonResponse({ token, user: { id: adminUser.id, username: adminUser.username, display_name: adminUser.display_name } });
    }

    // VERIFY TOKEN
    const token = body.token || '';
    const claims = await verifyToken(token, tokenSecret);
    if (!claims) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    // DASHBOARD STATS (with pagination)
    if (action === 'dashboard') {
      const page = Math.max(1, Number(body.page) || 1);
      const perPage = Math.min(200, Math.max(10, Number(body.per_page) || 50));
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const [visits, events, blocked] = await Promise.all([
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('funnel_events').select('*', { count: 'exact', head: true }),
        supabase.from('blocked_ips').select('*', { count: 'exact', head: true }),
      ]);

      // Paginated visits
      const { data: recentVisits, count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        // .range(from, to);
      // Remove pagination for visits
      // .range(from, to);

      // Paginated funnel events
      const { data: funnelData, count: funnelCount } = await supabase
        .from('funnel_events')
        .select('event_type, cpf, created_at, metadata, session_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        // .range(from, to);
      // Remove pagination for funnel events
      // .range(from, to);

      // Country breakdown (no pagination - used for aggregation)
      const { data: countryData } = await supabase
        .from('visits')
        .select('country_code, city, region');

      // Paginated blocked IPs
      const { data: blockedList, count: blockedCount } = await supabase
        .from('blocked_ips')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        // .range(from, to);
      // Remove pagination for blocked IPs
      // .range(from, to);

      // All funnel events for aggregation (counts, values)
      const { data: allFunnelData } = await supabase
        .from('funnel_events')
        .select('event_type, cpf, session_id, metadata');

      return jsonResponse({
        stats: {
          total_visits: visits.count || 0,
          total_events: events.count || 0,
          total_blocked: blocked.count || 0,
        },
        recentVisits: recentVisits || [],
        funnelData: funnelData || [],
        allFunnelData: allFunnelData || [],
        countryData: countryData || [],
        blockedList: blockedList || [],
        pagination: {
          page,
          per_page: perPage,
          visits_total: visitsCount || 0,
          funnel_total: funnelCount || 0,
          blocked_total: blockedCount || 0,
        },
      });
    }

    // LIST ADMIN USERS
    if (action === 'list_users') {
      const { data: users } = await supabase
        .from('admin_users')
        .select('id, username, display_name, created_at, last_login')
        .order('created_at', { ascending: true });

      return jsonResponse({ users: users || [] });
    }

    // ADD ADMIN USER
    if (action === 'add_user') {
      const { username, password, display_name } = body;
      if (!username || !password) {
        return jsonResponse({ error: 'Username e senha obrigatórios' }, 400);
      }

      const { error } = await supabase.rpc('create_admin_user', {
        p_username: username,
        p_password: password,
        p_display_name: display_name || username,
      });

      if (error) {
        return jsonResponse({ error: error.message.includes('unique') ? 'Usuário já existe' : error.message }, 400);
      }

      return jsonResponse({ ok: true });
    }

    // DELETE ADMIN USER
    if (action === 'delete_user') {
      const { user_id } = body;
      if (user_id === claims.sub) {
        return jsonResponse({ error: 'Não é possível remover seu próprio usuário' }, 400);
      }

      await supabase.from('admin_users').delete().eq('id', user_id);
      return jsonResponse({ ok: true });
    }

    // BLOCK IP MANUALLY
    if (action === 'block_ip') {
      const { ip_address, reason } = body;
      if (!ip_address) {
        return jsonResponse({ error: 'IP obrigatório' }, 400);
      }
      const { error } = await supabase.from('blocked_ips').upsert(
        { ip_address, reason: reason || 'Bloqueio manual' },
        { onConflict: 'ip_address' }
      );
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      return jsonResponse({ ok: true });
    }

    // UNBLOCK IP
    if (action === 'unblock_ip') {
      const { ip_address } = body;
      if (!ip_address) {
        return jsonResponse({ error: 'IP obrigatório' }, 400);
      }
      await supabase.from('blocked_ips').delete().eq('ip_address', ip_address);
      return jsonResponse({ ok: true });
    }

    // CLEAR ALL DATA
    if (action === 'clear_data') {
      await Promise.all([
        supabase.from('funnel_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('visits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('blocked_ips').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      return jsonResponse({ ok: true, message: 'Dados limpos com sucesso' });
    }

    return jsonResponse({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('Admin auth error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});
