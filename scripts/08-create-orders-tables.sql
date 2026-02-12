-- Orders and Store Tables for Printful Integration
-- This script creates/updates the tables needed for the e-commerce system

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_mockups CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS store_categories CASCADE;

-- 1. CATEGORIAS DA LOJA
CREATE TABLE store_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUTOS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  printful_id TEXT NOT NULL,
  printful_sync_product_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Controle de Margem e Preço
  cost_price DECIMAL(10,2) DEFAULT 0,
  markup_type TEXT DEFAULT 'percent' CHECK (markup_type IN ('percent', 'fixed')),
  markup_value DECIMAL(10,2) DEFAULT 20,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  category_id UUID REFERENCES store_categories(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VARIANTES
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  printful_variant_id TEXT NOT NULL,
  printful_catalog_variant_id TEXT,
  
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  
  -- Preços
  price DECIMAL(10,2) NOT NULL, -- Preço de venda
  retail_price DECIMAL(10,2) NOT NULL, -- Preço final de venda
  cost_price DECIMAL(10,2), -- Custo base específico desta variante
  
  in_stock BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MOCKUPS
CREATE TABLE product_mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PEDIDOS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL DEFAULT (uuid_generate_v4()::text),
  printful_order_id TEXT,
  
  status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (
    status IN ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELED', 'TEST_ORDER')
  ),
  
  -- Dados do Cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Endereço (JSONB para flexibilidade)
  shipping_address JSONB,
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  currency TEXT DEFAULT 'BRL',
  
  -- Pagamento
  payment_method TEXT, -- stripe, mercadopago
  payment_id TEXT, -- ID da transação
  payment_status TEXT DEFAULT 'pending',
  
  -- Printful
  printful_dashboard_url TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Test mode
  is_test BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ITENS DO PEDIDO
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),
  
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  
  -- Printful data
  printful_variant_id TEXT,
  printful_sync_variant_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_printful_id ON products(printful_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_printful_id ON product_variants(printful_variant_id);
CREATE INDEX idx_orders_external_id ON orders(external_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (products only)
CREATE POLICY "Public read access to categories" ON store_categories FOR SELECT USING (true);
CREATE POLICY "Public read access to active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to product variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read access to product mockups" ON product_mockups FOR SELECT USING (true);

-- Users can only read their own orders
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (true); -- TODO: Add auth.user_id = customer_id when auth is implemented
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (true); -- TODO: Add auth.user_id in orders join

-- Insert default categories
INSERT INTO store_categories (name, slug, description, display_order) VALUES
('Camisetas', 'camisetas', 'Camisetas estampadas de alta qualidade', 1),
('Acessórios', 'acessorios', 'Acessórios variados como canecas e capinhas', 2),
('Moletons', 'moletons', 'Moletons e blusas de frio', 3),
('Outros', 'outros', 'Outros produtos personalizados', 99);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
