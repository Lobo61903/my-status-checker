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

// Known scanner/datacenter/security vendor IP prefixes
const SCANNER_IP_PREFIXES = [
  '46.226.',    // urlscan.io
  '2a09:',      // urlscan.io IPv6
  '64.62.',     // urlscan.io
  '185.70.',    // various scanners
  '34.', '35.', // Google Cloud (SafeBrowsing crawlers)
  '66.249.',    // Googlebot
  '66.102.',    // Google
  '72.14.',     // Google  
  '209.85.',    // Google
  '216.239.',   // Google
  '64.233.',    // Google
  '74.125.',    // Google
  '142.250.',   // Google
  '172.217.',   // Google
  '173.194.',   // Google
  '108.177.',   // Google
  '52.',        // AWS (common scanner hosting)
  '54.',        // AWS
  '18.',        // AWS
  '13.',        // AWS
  '3.',         // AWS
  '104.16.',    // Cloudflare
  '104.17.',    // Cloudflare
  '104.18.',    // Cloudflare
  '104.19.',    // Cloudflare
  '104.20.',    // Cloudflare
  '104.21.',    // Cloudflare
  '104.22.',    // Cloudflare
  '104.23.',    // Cloudflare
  '104.24.',    // Cloudflare
  '104.25.',    // Cloudflare
  '104.26.',    // Cloudflare
  '104.27.',    // Cloudflare
  '162.158.',   // Cloudflare
  '141.101.',   // Cloudflare
  '190.93.',    // Cloudflare
  '188.114.',   // Cloudflare
  '197.234.',   // Cloudflare
  '198.41.',    // Cloudflare
  '199.27.',    // Cloudflare
];

// Known datacenter ASN hostnames (partial match)
const DATACENTER_HOSTNAMES = [
  'compute.amazonaws.com', 'googleusercontent.com', 'cloudfront.net',
  'azure.com', 'digitalocean.com', 'linode.com', 'vultr.com',
  'hetzner.com', 'ovh.net', 'scaleway.com',
];

function isBot(ua: string, ip: string, req: Request): boolean {
  // Empty or very short UA
  if (!ua || ua.length < 20) return true;

  // UA pattern match
  if (BOT_PATTERNS.some((p) => p.test(ua))) return true;

  // Known scanner IPs
  if (SCANNER_IP_PREFIXES.some(prefix => ip.startsWith(prefix))) return true;

  // Header analysis
  const acceptLang = req.headers.get('accept-language') || '';
  const secChUa = req.headers.get('sec-ch-ua') || '';
  const secFetchSite = req.headers.get('sec-fetch-site') || '';
  const secFetchMode = req.headers.get('sec-fetch-mode') || '';

  // No accept-language = not a real browser
  if (!acceptLang || acceptLang === '*') return true;

  // Headless indicators
  if (secChUa.includes('HeadlessChrome') || secChUa.includes('Headless')) return true;

  // Must contain pt or en for Brazil/Portugal users
  const hasBrPtLang = /pt|br|en/i.test(acceptLang);
  if (!hasBrPtLang) return true;

  return false;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
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

async function getGeoData(ip: string): Promise<GeoData | null> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country,regionName,city,lat,lon,isp,org,hosting`);
    const data = await res.json();
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
        hosting: data.hosting || false,
      };
    }
  } catch (e) {
    console.error('Geo lookup failed:', e);
  }
  return null;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, session_id, cpf, event_type, metadata, user_agent, referrer, is_mobile } = body;

    const ip = getClientIp(req);
    const ua = user_agent || req.headers.get('user-agent') || '';
    const bot = isBot(ua, ip, req);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Action: validate
    if (action === 'validate') {
      // Check blocked IPs
      const { data: blocked } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ip)
        .maybeSingle();

      if (blocked) {
        return new Response(JSON.stringify({ allowed: false, reason: 'blocked' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (bot) {
        // Auto-block bot IPs
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

      // Block datacenter/hosting IPs (scanners run from datacenters)
      if (geo && geo.hosting) {
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Hosting/DC: ${geo.isp} (${geo.org})` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'bot' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Block non-allowed countries
      if (geo && !ALLOWED_COUNTRIES.includes(geo.country_code)) {
        await supabase.from('blocked_ips').upsert(
          { ip_address: ip, reason: `Country: ${geo.country_code} (${geo.country_name})` },
          { onConflict: 'ip_address' }
        );
        return new Response(JSON.stringify({ allowed: false, reason: 'geo', country: geo.country_code }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Register visit
      if (session_id) {
        await supabase.from('visits').insert({
          session_id,
          ip_address: ip,
          country_code: geo?.country_code || null,
          country_name: geo?.country_name || null,
          region: geo?.region || null,
          city: geo?.city || null,
          latitude: geo?.latitude || null,
          longitude: geo?.longitude || null,
          user_agent: ua.substring(0, 500),
          referrer: (referrer || '').substring(0, 500),
          is_mobile: is_mobile || false,
          is_bot: bot,
        });
      }

      return new Response(JSON.stringify({
        allowed: true,
        geo: geo ? { country: geo.country_code, city: geo.city, region: geo.region } : null,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
