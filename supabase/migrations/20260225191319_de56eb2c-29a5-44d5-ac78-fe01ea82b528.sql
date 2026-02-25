
-- 1. Tighten RLS: Replace overly permissive USING(true) with proper service-role-only checks
-- These tables should ONLY be accessible via service_role (edge functions), never via anon

-- app_settings: drop old, add proper
DROP POLICY IF EXISTS "Service role full access on app_settings" ON public.app_settings;
CREATE POLICY "Deny all access on app_settings"
  ON public.app_settings
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- blocked_ips
DROP POLICY IF EXISTS "Allow service role full access on blocked_ips" ON public.blocked_ips;
CREATE POLICY "Deny all access on blocked_ips"
  ON public.blocked_ips
  AS RESTRICTIVE
  FOR ALL
  USING (false);

-- cpf_device_locks
DROP POLICY IF EXISTS "Service role full access on cpf_device_locks" ON public.cpf_device_locks;
CREATE POLICY "Deny all access on cpf_device_locks"
  ON public.cpf_device_locks
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- cpf_whitelist
DROP POLICY IF EXISTS "Service role full access on cpf_whitelist" ON public.cpf_whitelist;
CREATE POLICY "Deny all access on cpf_whitelist"
  ON public.cpf_whitelist
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2. Tighten funnel_events: restrict INSERT to only valid event types and limit field sizes
-- Replace permissive insert with a check constraint on event_type
DROP POLICY IF EXISTS "Allow anonymous inserts on funnel_events" ON public.funnel_events;
CREATE POLICY "Restricted anonymous inserts on funnel_events"
  ON public.funnel_events
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    length(session_id) <= 36
    AND length(event_type) <= 50
    AND (cpf IS NULL OR length(cpf) <= 14)
  );

-- 3. Tighten visits: restrict INSERT field sizes  
DROP POLICY IF EXISTS "Allow anonymous inserts on visits" ON public.visits;
CREATE POLICY "Restricted anonymous inserts on visits"
  ON public.visits
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    length(session_id) <= 36
    AND (ip_address IS NULL OR length(ip_address) <= 45)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (referrer IS NULL OR length(referrer) <= 500)
    AND (country_code IS NULL OR length(country_code) <= 5)
  );
