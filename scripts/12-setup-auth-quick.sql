-- Setup Rápido de Autenticação
-- Execute este script PRIMEIRO no Supabase SQL Editor

-- 1. Habilita RLS nas tabelas de autenticação
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

-- 2. Cria tabela de profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'customer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cria índices
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- 4. Cria trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 6. Cria usuário admin automaticamente
INSERT INTO profiles (user_id, email, full_name, role, is_active)
SELECT 
    id,
    email,
    'Admin MonterCave',
    'admin',
    true
FROM auth.users 
WHERE email = 'admin@monstercave.com'
ON CONFLICT (email) DO NOTHING;

-- 7. Se não existir usuário admin, cria um básico
-- NOTA: Você ainda precisa criar o usuário via Authentication > Users no painel
-- ou usar o script 10-create-admin-user.sql

-- 8. Verificação
SELECT 
    'profiles' as table_name,
    count(*) as total_records
FROM profiles

UNION ALL

SELECT 
    'admin_users' as table_name,
    count(*) as total_records  
FROM profiles 
WHERE role = 'admin';

-- 9. Verifica se usuário admin existe
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@monstercave.com' OR p.role = 'admin';
