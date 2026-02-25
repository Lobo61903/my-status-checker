
-- Update admin password
UPDATE public.admin_users 
SET password_hash = extensions.crypt('Lore@0902', extensions.gen_salt('bf'))
WHERE username = 'admin';
