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
        return new Response(JSON.stringify({ error: 'Credenciais obrigatórias' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: user, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password,
      });

      if (error || !user || user.length === 0) {
        return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const adminUser = user[0];
      await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminUser.id);

      const token = await createToken({ sub: adminUser.id, username: adminUser.username, name: adminUser.display_name }, tokenSecret);

      return new Response(JSON.stringify({ token, user: { id: adminUser.id, username: adminUser.username, display_name: adminUser.display_name } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VERIFY TOKEN (middleware) — use body.token (not the authorization header, which is the Supabase anon key)
    const token = body.token || '';
    const claims = await verifyToken(token, tokenSecret);
    if (!claims) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DASHBOARD STATS
    if (action === 'dashboard') {
      const [visits, events, blocked] = await Promise.all([
        supabase.from('visits').select('*', { count: 'exact' }),
        supabase.from('funnel_events').select('*', { count: 'exact' }),
        supabase.from('blocked_ips').select('*', { count: 'exact' }),
      ]);

      // Recent visits
      const { data: recentVisits } = await supabase
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Funnel stats
      const { data: funnelData } = await supabase
        .from('funnel_events')
        .select('event_type, cpf, created_at, metadata, session_id')
        .order('created_at', { ascending: false })
        .limit(500);

      // Country breakdown
      const { data: countryData } = await supabase
        .from('visits')
        .select('country_code, city, region');

      // Blocked IPs
      const { data: blockedList } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({
        stats: {
          total_visits: visits.count || 0,
          total_events: events.count || 0,
          total_blocked: blocked.count || 0,
        },
        recentVisits: recentVisits || [],
        funnelData: funnelData || [],
        countryData: countryData || [],
        blockedList: blockedList || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // LIST ADMIN USERS
    if (action === 'list_users') {
      const { data: users } = await supabase
        .from('admin_users')
        .select('id, username, display_name, created_at, last_login')
        .order('created_at', { ascending: true });

      return new Response(JSON.stringify({ users: users || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ADD ADMIN USER
    if (action === 'add_user') {
      const { username, password, display_name } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username e senha obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.rpc('create_admin_user', {
        p_username: username,
        p_password: password,
        p_display_name: display_name || username,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message.includes('unique') ? 'Usuário já existe' : error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE ADMIN USER
    if (action === 'delete_user') {
      const { user_id } = body;
      if (user_id === claims.sub) {
        return new Response(JSON.stringify({ error: 'Não é possível remover seu próprio usuário' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('admin_users').delete().eq('id', user_id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // BLOCK IP MANUALLY
    if (action === 'block_ip') {
      const { ip_address, reason } = body;
      if (!ip_address) {
        return new Response(JSON.stringify({ error: 'IP obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('blocked_ips').upsert(
        { ip_address, reason: reason || 'Bloqueio manual' },
        { onConflict: 'ip_address' }
      );
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CLEAR ALL DATA
    if (action === 'clear_data') {
      await Promise.all([
        supabase.from('funnel_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('visits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('blocked_ips').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      return new Response(JSON.stringify({ ok: true, message: 'Dados limpos com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
