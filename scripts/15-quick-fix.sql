-- Quick Fix - Cria usuário admin do zero
-- Execute no SQL Editor do Supabase

-- 1. Deleta usuário admin existente (se houver)
DELETE FROM profiles WHERE email = 'admin@monstercave.com';

-- 2. Cria profile admin manualmente
INSERT INTO profiles (user_id, email, full_name, role, is_active, created_at)
SELECT 
    id,
    email,
    'Admin MonterCave',
    'admin',
    true,
    NOW()
FROM auth.users 
WHERE email = 'admin@monstercave.com';

-- 3. Verificação
SELECT 'PROFILE CRIADO' as status, email, role, is_active 
FROM profiles 
WHERE email = 'admin@monstercave.com';
