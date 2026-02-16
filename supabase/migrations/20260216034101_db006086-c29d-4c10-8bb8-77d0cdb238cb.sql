
-- Admin users table for panel access
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access admin_users (no public access)
CREATE POLICY "No public access to admin_users" ON public.admin_users
  FOR ALL USING (false);

-- Insert default admin user (password hashed with pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.admin_users (username, password_hash, display_name)
VALUES ('admin', crypt('Lore@0902', gen_salt('bf')), 'Administrador');
