const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_COUNTRIES = ['BR', 'PT'];

// Simple bot detection via User-Agent
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
];

// Known scanner/datacenter IP ranges (partial)
const SCANNER_IP_PREFIXES = [
  '46.226.', // urlscan.io infrastructure
  '2a09:',   // urlscan.io IPv6
  '64.62.',  // urlscan.io
  '185.70.', // various scanners
];

function isBot(ua: string, ip: string, req: Request): boolean {
  if (!ua || ua.length < 10) return true;
  if (BOT_PATTERNS.some((p) => p.test(ua))) return true;
  
  // Check known scanner IPs
  if (SCANNER_IP_PREFIXES.some(prefix => ip.startsWith(prefix))) return true;
  
  // Check suspicious headers - scanners often have unusual accept headers
  const accept = req.headers.get('accept') || '';
  const acceptLang = req.headers.get('accept-language') || '';
  
  // No accept-language is very suspicious for a "real browser"
  if (!acceptLang || acceptLang === '*') return true;
  
  // Check for headless indicators in headers
  const secChUa = req.headers.get('sec-ch-ua') || '';
  if (secChUa.includes('HeadlessChrome') || secChUa.includes('Headless')) return true;
  
  return false;
}

// Get real client IP from headers
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
}

async function getGeoData(ip: string): Promise<GeoData | null> {
  try {
    // Use ip-api.com (free, no key needed, 45 req/min)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country,regionName,city,lat,lon`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country_code: data.countryCode,
        country_name: data.country,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
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

    // Action: validate — check geo + bot + blocked IP
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
        return new Response(JSON.stringify({ allowed: false, reason: 'bot' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geo = await getGeoData(ip);

      // Allow if geo lookup fails (don't block real users on API failure)
      // Block if country is known and not in allowed list
      if (geo && !ALLOWED_COUNTRIES.includes(geo.country_code)) {
        // Auto-block this IP
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

    // Action: event — track funnel event
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
