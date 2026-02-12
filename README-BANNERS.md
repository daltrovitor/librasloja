# Configuração de Banners - MonsterCave

## Visão Geral

Este documento explica como configurar o sistema de banners para que os banners adicionados no painel administrativo apareçam na loja.

## Como Funciona

1. **Upload no Admin**: No painel administrativo (`/admin`), na aba "Banners", você pode fazer upload de imagens
2. **Storage**: As imagens são salvas no Supabase Storage
3. **Database**: As informações dos banners são salvas na tabela `slider_images`
4. **Exibição**: O componente `HeroSliderSimple` busca os banners da API `/api/highlights/images` e exibe na página inicial

## Configuração Passo a Passo

### 1. Configurar Variáveis de Ambiente

Verifique se seu arquivo `.env` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 2. Configurar Supabase

#### A. Criar Tabelas

Execute este SQL no Editor SQL do seu Supabase:

```sql
-- Criar tabela para banners
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS slider_images_display_order_idx ON slider_images(display_order);

-- Habilitar RLS (Row Level Security)
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Enable read access for all users" ON slider_images
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON slider_images
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role" ON slider_images
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete for service role" ON slider_images
  FOR DELETE USING (auth.role() = 'service_role');

-- Permissões
GRANT ALL ON slider_images TO authenticated;
GRANT ALL ON slider_images TO service_role;
GRANT SELECT ON slider_images TO anon;
```

#### B. Criar Storage Buckets

No painel do Supabase:

1. Vá para **Storage**
2. Clique em **Create a new bucket**
3. Crie um bucket chamado `images` com as configurações:
   - **Public bucket**: Sim
   - **File size limit**: 5MB (ou o que preferir)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

4. Crie outro bucket chamado `uploads` com as mesmas configurações

#### C. Configurar Políticas de Storage

Execute este SQL no Editor SQL:

```sql
-- Políticas para o bucket images
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow service role to upload to images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND auth.role() = 'service_role'
  );

CREATE POLICY "Allow service role to update images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND auth.role() = 'service_role'
  );

CREATE POLICY "Allow service role to delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND auth.role() = 'service_role'
  );

-- Repetir para o bucket uploads
CREATE POLICY "Allow public read access to uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Allow service role to upload to uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.role() = 'service_role'
  );

CREATE POLICY "Allow service role to update uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' AND auth.role() = 'service_role'
  );

CREATE POLICY "Allow service role to delete uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND auth.role() = 'service_role'
  );
```

### 3. Verificar Componentes

#### A. Página Principal

Certifique-se de que a página principal (`app/page.tsx`) inclua o componente `HeroSection`:

```tsx
import { HeroSection } from "@/components/hero-section"

// No retorno do componente:
<HeroSection />
```

#### B. Hero Section

O componente `components/hero-section.tsx` já está configurado para usar `HeroSliderSimple`.

#### C. Hero Slider

O componente `components/hero-slider-simple.tsx` já está configurado para:
- Buscar banners de `/api/highlights/images`
- Exibir banners com navegação
- Fallback para banners locais se o servidor falhar

### 4. Testar

1. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse o painel administrativo**:
   ```
   http://localhost:3000/admin
   ```

3. **Faça upload de um banner**:
   - Vá para a aba "Banners"
   - Clique em "Escolher imagem"
   - Selecione uma imagem
   - Clique em "Adicionar Banner"

4. **Verifique na página principal**:
   - Acesse `http://localhost:3000`
   - O banner deve aparecer no hero slider

## Troubleshooting

### Erro: "Server upload error: {}"

**Causa**: Geralmente é problema de configuração do Supabase.

**Solução**:
1. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto no `.env`
2. Verifique se os buckets foram criados no Supabase Storage
3. Verifique as políticas de RLS para storage
4. Verifique os logs do servidor (terminal) para erros detalhados

### Erro: "Bucket not found"

**Causa**: Os buckets não foram criados ou têm nomes diferentes.

**Solução**:
1. Crie os buckets `images` e `uploads` no Supabase Storage
2. Ou defina `SUPABASE_STORAGE_BUCKET=nome-do-seu-bucket` no `.env`

### Erro: "Invalid API key"

**Causa**: A chave de serviço está incorreta ou expirou.

**Solução**:
1. Vá para Settings > API no painel do Supabase
2. Gere uma nova service_role key
3. Atualize o `.env` com a nova chave
4. Reinicie o servidor

### Banners não aparecem na página

**Causas possíveis**:
1. Componente `HeroSection` não está na página principal
2. Erro ao carregar da API
3. Problemas de permissão no Supabase

**Solução**:
1. Verifique o console do navegador para erros
2. Verifique se `HeroSection` está em `app/page.tsx`
3. Teste a API diretamente: `http://localhost:3000/api/highlights/images`

## Estrutura de Arquivos

```
├── app/
│   ├── api/highlights/images/route.ts     # API para banners
│   └── page.tsx                          # Página principal
├── components/
│   ├── admin/simple-dashboard.tsx         # Painel admin
│   ├── hero-section.tsx                   # Seção hero
│   └── hero-slider-simple.tsx             # Slider de banners
└── scripts/
    ├── setup-supabase.sql                 # Script SQL completo
    └── create-buckets.js                  # Script para criar buckets
```

## Próximos Passos

1. Configure o Supabase conforme descrito acima
2. Teste o upload de banners
3. Personalize o estilo do hero slider se necessário
4. Adicione validações extras se desejar (tamanho máximo, etc.)

---

Se precisar de ajuda, verifique os logs detalhados que adicionamos no backend e no frontend para identificar problemas específicos.
