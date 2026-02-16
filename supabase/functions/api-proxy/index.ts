const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_BASE = 'http://179.0.178.102:5000';
const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET_KEY') || '';

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
    } catch (error) {
      return new Response('Logo not found', { status: 404, headers: corsHeaders });
    }
  }

  try {
    const body = await req.json();
    const { endpoint, cpf, nome, valor, recaptchaToken } = body;

    const allowedEndpoints = ['/consulta', '/pendencias', '/criar-venda'];
    if (!endpoint || !allowedEndpoints.includes(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify reCAPTCHA v2 for consulta/pendencias
    if (endpoint !== '/criar-venda' && recaptchaToken) {
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
