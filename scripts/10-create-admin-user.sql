-- Criar usuário Admin padrão
-- Execute este script no Supabase SQL Editor

-- 1. Cria o usuário no auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    email,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
) 
SELECT 
    '00000000-0000-0000-0000-000000000000', -- instance_id padrão
    gen_random_uuid(),
    'admin@monstercave.com',
    NOW(),
    NULL,
    NULL,
    '{"name": "Admin MonterCave"}',
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@monstercave.com'
);

-- 2. Cria o profile com role admin
INSERT INTO profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'Admin MonterCave',
    'admin',
    true,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@monstercave.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
);

-- 3. Define uma senha temporária (você precisará redefinir)
-- NOTA: Por segurança, a senha deve ser definida via Supabase Auth UI ou API
-- Execute o seguinte comando no seu terminal ou use o painel do Supabase:

-- curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "admin@monstercave.com",
--     "password": "Monstercave@2024!",
--     "email_confirm": true
--   }'

-- Ou use o painel do Supabase:
-- 1. Vá para Authentication > Users
-- 2. Encontre admin@monstercave.com
-- 3. Clique em "Reset Password" ou defina diretamente

-- 4. Verificação
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@monstercave.com';
