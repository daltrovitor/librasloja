-- Reset de Senha do Usuário Admin
-- Execute no SQL Editor do Supabase

-- 1. Verifica o usuário atual
SELECT 'USUÁRIO ATUAL' as info, id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'admin@monstercave.com';

-- 2. Deleta o usuário antigo (vamos recriar)
DELETE FROM auth.users WHERE email = 'admin@monstercave.com';

-- NOTA: Você precisará criar o usuário manualmente no painel do Supabase
-- Authentication → Users → Add User
-- Email: admin@monstercave.com
-- Senha: Monstercave@2024!
-- Marque: Auto-confirm

-- 3. Verificação final
SELECT 'VERIFICAÇÃO FINAL' as status, COUNT(*) as total_auth_users 
FROM auth.users WHERE email = 'admin@monstercave.com'

UNION ALL

SELECT 'PROFILES' as status, COUNT(*) as total_profiles 
FROM profiles WHERE email = 'admin@monstercave.com';
