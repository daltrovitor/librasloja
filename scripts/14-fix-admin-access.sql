-- Script para Corrigir Acesso Admin
-- Execute no SQL Editor do Supabase

-- 1. Verifica se usuário existe
SELECT 'USUÁRIOS AUTH' as tabela, u.email, 
       COALESCE(u.email_confirmed_at::text, 'null') as status, 
       u.created_at::text as created_at
FROM auth.users u
WHERE u.email = 'admin@monstercave.com'

UNION ALL

-- 2. Verifica se profile existe
SELECT 'PROFILES' as tabela, p.email, 
       p.role as status, 
       p.is_active::text as created_at
FROM profiles p
WHERE p.email = 'admin@monstercave.com';

-- 3. Se não existir profile, cria um
INSERT INTO profiles (user_id, email, full_name, role, is_active)
SELECT 
    id,
    email,
    'Admin MonterCave',
    'admin',
    true
FROM auth.users 
WHERE email = 'admin@monstercave.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@monstercave.com'
);

-- 4. Reseta a senha do usuário (você precisará definir nova)
-- NOTA: Isso vai invalidar a sessão atual
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@monstercave.com';

-- 5. Verificação final
SELECT 'VERIFICAÇÃO FINAL' as status, p.email, p.role, p.is_active
FROM profiles p
WHERE p.email = 'admin@monstercave.com';
