
-- 1. Delete suspicious admin users (keep only 'admin')
DELETE FROM public.admin_users WHERE username != 'admin';

-- 2. Revoke anon/public access to sensitive RPCs
REVOKE EXECUTE ON FUNCTION public.create_admin_user(text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.verify_admin_login(text, text) FROM anon, public;

-- 3. Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  username text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by IP
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created ON public.login_attempts(ip_address, created_at DESC);

-- RLS: block all public access, only service role
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to login_attempts"
  ON public.login_attempts
  AS RESTRICTIVE
  FOR ALL
  USING (false);

-- 4. Auto-cleanup old login attempts (older than 24h) via a function
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '24 hours';
$$;

-- Revoke this cleanup function from anon too
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM anon, public;
