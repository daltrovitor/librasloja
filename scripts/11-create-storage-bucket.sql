-- Criar bucket de uploads no Supabase Storage
-- Execute este script no Supabase SQL Editor

-- 1. Cria o bucket de uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'uploads',
    'uploads',
    true,
    5242880, -- 5MB em bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Cria políticas de acesso (RLS)
-- Política para uploads públicos (qualquer um pode ler)
CREATE POLICY "Public uploads are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Política para usuários autenticados fazerem upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
);

-- Política para usuários só poderem atualizar/deletar seus próprios arquivos
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Verificação
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'uploads';

-- NOTA: Se você tiver problemas com as políticas, pode usar uma política mais simples:
-- 
-- DROP POLICY IF EXISTS "Public uploads are viewable by everyone" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
-- 
-- CREATE POLICY "Allow all operations on uploads" ON storage.objects FOR ALL
-- USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');
