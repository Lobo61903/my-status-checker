
-- FULL DATABASE CLEANUP - Remove all data from all operational tables

-- 1. Clear all tracking/analytics
DELETE FROM public.funnel_events;
DELETE FROM public.visits;

-- 2. Clear all blocked IPs (including fake ones from intruder)
DELETE FROM public.blocked_ips;

-- 3. Clear device locks
DELETE FROM public.cpf_device_locks;

-- 4. Clear login attempts
DELETE FROM public.login_attempts;

-- 5. Clear whitelist
DELETE FROM public.cpf_whitelist;

-- 6. Reset app settings
DELETE FROM public.app_settings;

-- 7. Recreate primary admin user with new password
SELECT public.create_admin_user('admin', 'Adm!n2026#Sec', 'Administrador');
