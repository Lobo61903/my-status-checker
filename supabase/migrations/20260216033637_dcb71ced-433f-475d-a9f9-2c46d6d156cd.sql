
-- Tabela de visitas com geolocalização
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  country_code TEXT,
  country_name TEXT,
  region TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_agent TEXT,
  referrer TEXT,
  is_mobile BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos do funil
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  cpf TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de IPs bloqueados
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_visits_session ON public.visits(session_id);
CREATE INDEX idx_visits_created ON public.visits(created_at DESC);
CREATE INDEX idx_visits_country ON public.visits(country_code);
CREATE INDEX idx_funnel_session ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_cpf ON public.funnel_events(cpf);
CREATE INDEX idx_funnel_event_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_created ON public.funnel_events(created_at DESC);
CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips(ip_address);

-- RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Policies: allow inserts from edge functions (service role) and anon for tracking
CREATE POLICY "Allow anonymous inserts on visits" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts on funnel_events" ON public.funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role full access on blocked_ips" ON public.blocked_ips FOR ALL USING (true);

-- No public SELECT on visits/funnel for security (only via service role in admin)
CREATE POLICY "Allow service role select on visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Allow service role select on funnel_events" ON public.funnel_events FOR SELECT USING (true);
