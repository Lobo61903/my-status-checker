
-- Function to verify admin login with explicit schema for pgcrypto
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, display_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT au.id, au.username, au.display_name
  FROM public.admin_users au
  WHERE au.username = p_username
    AND au.password_hash = extensions.crypt(p_password, au.password_hash);
$$;

-- Function to create admin user with explicit schema for pgcrypto
CREATE OR REPLACE FUNCTION public.create_admin_user(p_username TEXT, p_password TEXT, p_display_name TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  INSERT INTO public.admin_users (username, password_hash, display_name)
  VALUES (p_username, extensions.crypt(p_password, extensions.gen_salt('bf')), p_display_name);
$$;
