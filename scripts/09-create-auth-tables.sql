-- Authentication and User Management Tables
-- Execute this in your Supabase SQL Editor

-- 1. PERFIS DE USUÁRIO
CREATE TABLE IF NOT EXISTS profiles (
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

-- 2. ENDEREÇOS DE CLIENTES
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  -- expanded types and allow a free-form label
  type TEXT DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'home', 'work', 'other', 'pickup')),
  label TEXT, -- optional custom label (e.g., 'Casa', 'Trabalho')
  name TEXT NOT NULL,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  state_code TEXT NOT NULL,
  country_code TEXT DEFAULT 'BR',
  zip TEXT NOT NULL,
  phone TEXT,
  metadata JSONB, -- optional extra data (delivery instructions, coordinates, etc.)
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SESSÕES DE USUÁRIO (para tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HISTÓRICO DE LOGIN
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes para performance
-- Make sure user_id is unique so other tables can reference it safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
-- Avoid querying the same table inside a policy (causes recursion).
-- Use the JWT claim `role` to allow admin/manager access instead.
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- Policies para customer_addresses
CREATE POLICY "Users can manage own addresses" ON customer_addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all addresses" ON customer_addresses FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- Policies para user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON user_sessions FOR DELETE USING (auth.uid() = user_id);

-- Policies para login_history
CREATE POLICY "Users can view own login history" ON login_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all login history" ON login_history FOR SELECT USING (
  current_setting('jwt.claims.role', true) IN ('admin','manager')
);

-- Function para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Se o email for de admin, define role como admin
  IF NEW.email IN ('admin@suaempresa.com', 'manager@suaempresa.com') THEN
    UPDATE public.profiles SET role = 'admin' WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir admin inicial (opcional)
-- Descomente e ajuste o email após criar o usuário no Supabase Auth
/*
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT 
  id,
  email,
  'Administrador',
  'admin'
FROM auth.users 
WHERE email = 'admin@suaempresa.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
*/
