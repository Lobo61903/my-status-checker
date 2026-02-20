
-- Create CPF whitelist table
CREATE TABLE public.cpf_whitelist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero text,
  cpf text NOT NULL UNIQUE,
  nome text,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cpf_whitelist ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on cpf_whitelist"
ON public.cpf_whitelist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Whitelist enabled flag in a settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text NOT NULL PRIMARY KEY,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on app_settings"
ON public.app_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Default: whitelist OFF
INSERT INTO public.app_settings (key, value) VALUES ('whitelist_enabled', 'false') ON CONFLICT (key) DO NOTHING;
