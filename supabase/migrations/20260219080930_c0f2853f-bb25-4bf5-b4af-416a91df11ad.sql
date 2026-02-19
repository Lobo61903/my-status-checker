
CREATE TABLE public.cpf_device_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cpf)
);

ALTER TABLE public.cpf_device_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cpf_device_locks"
ON public.cpf_device_locks
FOR ALL
USING (true)
WITH CHECK (true);
