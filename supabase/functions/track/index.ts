const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_COUNTRIES = ['BR', 'PT'];

// Comprehensive bot/scanner UA patterns
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /facebookexternalhit/i, /linkedinbot/i, /twitterbot/i,
  /whatsapp/i, /telegrambot/i, /bingpreview/i, /semrush/i,
  /ahref/i, /mj12bot/i, /dotbot/i, /petalbot/i, /yandex/i,
  /baiduspider/i, /duckduckbot/i, /curl/i, /wget/i, /python/i,
  /httpx/i, /scrapy/i, /phantomjs/i, /headless/i, /selenium/i,
  /puppeteer/i, /playwright/i, /lighthouse/i, /gtmetrix/i,
  /urlscan/i, /scan/i, /checker/i, /monitor/i, /probe/i,
  /screenshotbot/i, /pagespeed/i, /pingdom/i, /uptimerobot/i,
  /ssllabs/i, /wappalyzer/i, /builtwith/i, /archive\.org/i,
  /webpagetest/i, /chrome-lighthouse/i, /screaming/i,
  /node-fetch/i, /axios/i, /got\//i, /undici/i, /fetch\//i,
  /Go-http-client/i, /Java\//i, /okhttp/i, /Apache-HttpClient/i,
  /CloudFlare/i, /Cloudinary/i, /APIs-Google/i,
  /PhishTank/i, /SafeBrowsing/i, /GoogleSafeBrowsing/i,
  /VirusTotal/i, /Sucuri/i, /SiteCheck/i, /Netcraft/i,
  /OpenPhish/i, /ESET/i, /Kaspersky/i, /Norton/i, /McAfee/i,
  /Avast/i, /Avira/i, /Bitdefender/i, /Symantec/i,
  /Sophos/i, /TrendMicro/i, /Comodo/i, /DrWeb/i,
  /ClamAV/i, /MalwareBytes/i, /Quttera/i, /SiteLock/i,
  /Censys/i, /Shodan/i, /ZoomEye/i, /BinaryEdge/i,
  /Nmap/i, /Masscan/i, /Zgrab/i, /RiskIQ/i, /IPinfo/i,
];

function isBot(ua: string, ip: string, req: Request): boolean {
  if (!ua || ua.length < 20) return true;
  if (BOT_PATTERNS.some((p) => p.test(ua))) return true;

  const acceptLang = req.headers.get('accept-language') || '';
  const secChUa = req.headers.get('sec-ch-ua') || '';

  if (!acceptLang || acceptLang === '*') return true;
  if (secChUa.includes('HeadlessChrome') || secChUa.includes('Headless')) return true;

  const hasBrPtLang = /pt|br|en/i.test(acceptLang);
  if (!hasBrPtLang) return true;

  return false;
}

function getClientIp(req: Request): string {
  // Try multiple headers for real IP
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // Take the FIRST IP (original client), not the last
    const first = xff.split(',')[0]?.trim();
    if (first && first !== '127.0.0.1' && first !== '::1') return first;
  }
  
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('true-client-ip') ||
    req.headers.get('x-client-ip') ||
    req.headers.get('x-cluster-client-ip') ||
    '0.0.0.0'
  );
}

interface GeoData {
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  org: string;
  hosting: boolean;
}

// Primary: ip-api.com (supports HTTP, 45 req/min free)
async function getGeoFromIpApi(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,country,regionName,city,lat,lon,isp,org,hosting,proxy,message`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    console.log(`[ip-api.com] IP=${ip} status=${data.status} country=${data.countryCode} hosting=${data.hosting} proxy=${data.proxy}`);
    if (data.status === 'success') {
      return {
        country_code: data.countryCode,
        country_name: data.country,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp || '',
        org: data.org || '',
        hosting: data.hosting || data.proxy || false,
      };
    }
    console.error(`[ip-api.com] Failed: ${data.message || 'unknown'}`);
  } catch (e) {
    console.error('[ip-api.com] Error:', e);
  }
  return null;
}

// Fallback: ipapi.co (HTTPS, 1000/day free)
async function getGeoFromIpapiCo(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(
      `https://ipapi.co/${ip}/json/`,
      { 
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );
    const data = await res.json();
    console.log(`[ipapi.co] IP=${ip} country=${data.country_code} org=${data.org}`);
    if (data.country_code) {
      const isHosting = /hosting|cloud|server|datacenter|data center|vps|dedicated/i.test(
        `${data.org || ''} ${data.asn || ''}`
      );
      return {
        country_code: data.country_code,
        country_name: data.country_name || '',
        region: data.region || '',
        city: data.city || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        isp: data.org || '',
        org: data.org || '',
        hosting: isHosting,
      };
    }
  } catch (e) {
    console.error('[ipapi.co] Error:', e);
  }
  return null;
}

// Fallback 2: ipwho.is (HTTPS, free, no key needed)
async function getGeoFromIpwhois(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(
      `https://ipwho.is/${ip}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    console.log(`[ipwho.is] IP=${ip} success=${data.success} country=${data.country_code}`);
    if (data.success) {
      return {
        country_code: data.country_code,
        country_name: data.country || '',
        region: data.region || '',
        city: data.city || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        isp: data.connection?.isp || '',
        org: data.connection?.org || '',
        hosting: data.connection?.type === 'hosting' || false,
      };
    }
  } catch (e) {
    console.error('[ipwho.is] Error:', e);
  }
  return null;
}

// Try multiple geo providers with fallback
async function getGeoData(ip: string): Promise<GeoData | null> {
  // Skip private/local IPs
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    console.log(`[geo] Skipping private IP: ${ip}`);
    return null;
  }

  let geo = await getGeoFromIpApi(ip);
  if (geo) return geo;

  console.log('[geo] Primary failed, trying ipapi.co...');
  geo = await getGeoFromIpapiCo(ip);
  if (geo) return geo;

  console.log('[geo] Secondary failed, trying ipwho.is...');
  geo = await getGeoFromIpwhois(ip);
  return geo;
}

// VPN detection heuristics
function detectVpn(geo: GeoData, timezone: string | undefined): boolean {
  // Common VPN/proxy ISP names
  const vpnIsps = [
    /vpn/i, /proxy/i, /tunnel/i, /nord/i, /express/i, /surfshark/i,
    /cyberghost/i, /private internet/i, /mullvad/i, /proton/i,
    /windscribe/i, /hotspot shield/i, /hide\.me/i, /ipvanish/i,
    /strongvpn/i, /purevpn/i, /torguard/i, /astrill/i,
    /warp/i, /cloudflare warp/i,
  ];

  const ispOrg = `${geo.isp} ${geo.org}`.toLowerCase();
  if (vpnIsps.some(p => p.test(ispOrg))) {
    console.log(`[vpn] Detected VPN ISP: ${ispOrg}`);
    return true;
  }

  return false;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, session_id, cpf, event_type, metadata, user_agent, referrer, is_mobile, timezone } = body;

    const ip = getClientIp(req);
    const ua = user_agent || req.headers.get('user-agent') || '';
    const bot = isBot(ua, ip, req);

    // Rate limiting: check recent requests from this IP (last 30 seconds)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[track] action=${action} ip=${ip} bot=${bot} ua=${ua.substring(0, 80)}`);

    // Log all headers for debugging IP resolution
    const headerEntries: Record<string, string> = {};
    for (const [key, value] of req.headers.entries()) {
      if (key.startsWith('x-') || key === 'cf-connecting-ip' || key === 'true-client-ip') {
        headerEntries[key] = value;
      }
    }
    console.log(`[track] IP headers:`, JSON.stringify(headerEntries));

    // Action: validate
    if (action === 'validate') {
      // Rate limiting: count recent visits from this IP (last 60 seconds)
      const { count: recentVisits } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', new Date(Date.now() - 60000).toISOString());

      if (recentVisits && recentVisits > 10) {
        console.log(`[track] Rate limit exceeded for IP ${ip}: ${recentVisits} visits in 60s`);
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Rate limit: ${recentVisits} req/min` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'rate_limit' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check blocked IPs
      const { data: blocked } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ip)
        .maybeSingle();

      if (blocked) {
        console.log(`[track] IP ${ip} is blocked`);
        return new Response(JSON.stringify({ allowed: false, reason: 'blocked' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (bot) {
        console.log(`[track] Bot detected: ${ip}`);
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Bot UA: ${ua.substring(0, 100)}` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'bot' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geo = await getGeoData(ip);

      if (!geo) {
        // If ALL geo lookups fail, BLOCK by default (fail-closed)
        console.log(`[track] All geo lookups failed for IP ${ip} — BLOCKING`);
        return new Response(JSON.stringify({ allowed: false, reason: 'geo' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Block datacenter/hosting IPs ONLY if from non-allowed countries
      // Many Brazilian ISPs are incorrectly classified as hosting/datacenter
      if (geo.hosting && !ALLOWED_COUNTRIES.includes(geo.country_code)) {
        console.log(`[track] Foreign hosting IP blocked: ${ip} (${geo.isp}) country=${geo.country_code}`);
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Hosting/DC: ${geo.isp} (${geo.org})` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'bot' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // VPN detection
      if (detectVpn(geo, timezone)) {
        console.log(`[track] VPN detected: ${ip} (${geo.isp})`);
        return new Response(JSON.stringify({ allowed: false, reason: 'vpn' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Block non-allowed countries
      if (!ALLOWED_COUNTRIES.includes(geo.country_code)) {
        console.log(`[track] Country blocked: ${geo.country_code} for IP ${ip}`);
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Country: ${geo.country_code} (${geo.country_name})` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'geo', country: geo.country_code }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[track] ALLOWED: ${ip} from ${geo.country_code} (${geo.city})`);

      // Register visit
      if (session_id) {
        await supabase.from('visits').insert({
          session_id,
          ip_address: ip,
          country_code: geo.country_code,
          country_name: geo.country_name,
          region: geo.region,
          city: geo.city,
          latitude: geo.latitude,
          longitude: geo.longitude,
          user_agent: ua.substring(0, 500),
          referrer: (referrer || '').substring(0, 500),
          is_mobile: is_mobile || false,
          is_bot: bot,
        });
      }

      return new Response(JSON.stringify({
        allowed: true,
        geo: { country: geo.country_code, city: geo.city, region: geo.region },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // Action: event
    if (action === 'event') {
      if (!session_id || !event_type) {
        return new Response(JSON.stringify({ error: 'Missing session_id or event_type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('funnel_events').insert({
        session_id,
        cpf: cpf || null,
        event_type,
        metadata: metadata || {},
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Track error:', error);
    // On error, BLOCK (fail-closed) to prevent bypass
    return new Response(JSON.stringify({ allowed: false, reason: 'error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
