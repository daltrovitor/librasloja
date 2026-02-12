-- Database Setup for Printful Integration
-- Run this in your Supabase SQL Editor

-- 1. PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  printful_id TEXT NOT NULL,
  printful_sync_product_id TEXT, -- ID do produto sincronizado
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Controle de Margem e Preço
  cost_price DECIMAL(10,2) DEFAULT 0, -- Custo base do Printful (estimado/cacheado)
  markup_type TEXT DEFAULT 'percent', -- 'percent' or 'fixed'
  markup_value DECIMAL(10,2) DEFAULT 20, -- Ex: 20% ou R$ 20.00
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  category_id UUID REFERENCES store_categories(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VARIANTES
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  printful_variant_id TEXT NOT NULL, -- ID do Sync Variant
  printful_catalog_variant_id TEXT, -- ID do Catalog Variant (para custo)
  
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  
  -- Preços
  retail_price DECIMAL(10,2) NOT NULL, -- Preço final de venda
  cost_price DECIMAL(10,2), -- Custo base específico desta variante
  
  in_stock BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MOCKUPS
CREATE TABLE IF NOT EXISTS product_mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false
);

-- 4. CATEGORIAS
CREATE TABLE IF NOT EXISTS store_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PEDIDOS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  printful_order_id TEXT, -- ID retornado pelo Printful
  external_id TEXT UNIQUE, -- Nosso ID de pedido
  
  status TEXT DEFAULT 'pending_payment', 
  -- Status: pending_payment, paid, processing, shipped, delivered, canceled, test_order
  
  -- Dados do Cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Endereço
  shipping_address JSONB,
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  currency TEXT DEFAULT 'BRL',
  
  payment_method TEXT, -- stripe, mercadopago
  payment_id TEXT, -- ID da transação
  
  printful_dashboard_url TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  is_test BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),
  
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
