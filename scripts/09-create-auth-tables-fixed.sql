-- Safe migration script for Supabase
-- Run in Supabase SQL Editor. This version avoids RAISE outside PL/pgSQL blocks.

-- 1) Extensões necessárias (idempotente)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Perfis (cria se ausente)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'customer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Endereços (cria se ausente)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT DEFAULT 'shipping' CHECK (type IN ('shipping','billing','home','work','other','pickup')),
  label TEXT,
  name TEXT NOT NULL,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  state_code TEXT NOT NULL,
  country_code TEXT DEFAULT 'BR',
  zip TEXT NOT NULL,
  phone TEXT,
  metadata JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) SESSÕES e HISTÓRICO (se já existirem, são ignorados)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5) Índices úteis
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON public.login_history(created_at);

-- 6) Criar índice único em profiles.user_id somente se NÃO houver duplicatas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (
      SELECT user_id FROM public.profiles GROUP BY user_id HAVING COUNT(*) > 1
    ) t
  ) THEN
    -- Duplicates found: signal via NOTICE (visible in SQL editor) and skip creation
    RAISE NOTICE 'Profiles contain duplicate user_id values. Run dedupe before creating unique index.';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'i' AND c.relname = 'idx_profiles_user_id'
    ) THEN
      EXECUTE 'CREATE UNIQUE INDEX idx_profiles_user_id ON public.profiles(user_id)';
      RAISE NOTICE 'Unique index idx_profiles_user_id created.';
    ELSE
      RAISE NOTICE 'Unique index idx_profiles_user_id already exists.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7) Habilitar RLS nas tabelas
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.login_history ENABLE ROW LEVEL SECURITY;

-- 8) Policies — removendo e recriando de forma segura (idempotente)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- customer_addresses policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all addresses" ON public.customer_addresses;
CREATE POLICY "Admins can view all addresses" ON public.customer_addresses FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- login_history policies
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;
CREATE POLICY "Users can view own login history" ON public.login_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all login history" ON public.login_history;
CREATE POLICY "Admins can view all login history" ON public.login_history FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- 9) Conceder privilégios básicos (ajuste conforme sua política)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT SELECT ON public.customer_addresses TO anon;

-- Nota: reinicie a API do Supabase manualmente (Project → Settings → API → Restart) se continuar vendo "relation does not exist".
-- Se o bloco acima reportar duplicatas, execute o script de deduplicação abaixo (backup antes):
--
-- Diagnóstico de duplicatas:
-- SELECT user_id, array_agg(id) AS profile_ids, count(*) AS c
-- FROM public.profiles
-- GROUP BY user_id
-- HAVING count(*) > 1;
--
-- Dedupe (manter mais recente por created_at): revisar antes de rodar
-- WITH duplicates AS (
--   SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
--   FROM public.profiles
-- )
-- DELETE FROM public.profiles WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- FIM
