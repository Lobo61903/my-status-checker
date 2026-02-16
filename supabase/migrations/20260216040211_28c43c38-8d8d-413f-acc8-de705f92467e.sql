
-- Fix RLS policies: change from RESTRICTIVE to PERMISSIVE

-- funnel_events
DROP POLICY IF EXISTS "Allow anonymous inserts on funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "Allow service role select on funnel_events" ON public.funnel_events;

CREATE POLICY "Allow anonymous inserts on funnel_events"
  ON public.funnel_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role select on funnel_events"
  ON public.funnel_events FOR SELECT
  USING (true);

-- visits
DROP POLICY IF EXISTS "Allow anonymous inserts on visits" ON public.visits;
DROP POLICY IF EXISTS "Allow service role select on visits" ON public.visits;

CREATE POLICY "Allow anonymous inserts on visits"
  ON public.visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role select on visits"
  ON public.visits FOR SELECT
  USING (true);

-- blocked_ips
DROP POLICY IF EXISTS "Allow service role full access on blocked_ips" ON public.blocked_ips;

CREATE POLICY "Allow service role full access on blocked_ips"
  ON public.blocked_ips FOR ALL
  USING (true);

-- admin_users
DROP POLICY IF EXISTS "No public access to admin_users" ON public.admin_users;

CREATE POLICY "No public access to admin_users"
  ON public.admin_users FOR ALL
  USING (false);
