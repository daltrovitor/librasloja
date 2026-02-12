-- Create shipping_rules table
CREATE TABLE IF NOT EXISTS shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code CHAR(2) UNIQUE NOT NULL, -- 'SP', 'RJ', etc. or 'DF' (Default)
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for shipping_rules" ON shipping_rules
    FOR SELECT USING (true);

CREATE POLICY "Admin full access for shipping_rules" ON shipping_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'manager')
        )
    );

-- Insert some defaults
INSERT INTO shipping_rules (state_code, price) VALUES 
('SP', 15.00),
('RJ', 20.00),
('MG', 25.00),
('XX', 40.00) -- Default fallback
ON CONFLICT (state_code) DO NOTHING;
