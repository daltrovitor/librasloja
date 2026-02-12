-- Setup script for MonsterCave Supabase Database
-- Execute this in your Supabase SQL Editor

-- 1. Create slider_images table for highlights/banner functionality
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create hero_slider_images table for hero slider functionality
CREATE TABLE IF NOT EXISTS hero_slider_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS slider_images_display_order_idx ON slider_images(display_order);
CREATE INDEX IF NOT EXISTS hero_slider_images_display_order_idx ON hero_slider_images(display_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slider_images ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Allow public read access to slider_images (for displaying banners)
CREATE POLICY "Enable read access for all users" ON slider_images
  FOR SELECT USING (true);

-- Allow admin insert/update/delete access to slider_images
CREATE POLICY "Enable insert for admin users" ON slider_images
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin users" ON slider_images
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin users" ON slider_images
  FOR DELETE USING (auth.role() = 'service_role');

-- Allow public read access to hero_slider_images
CREATE POLICY "Enable read access for all users" ON hero_slider_images
  FOR SELECT USING (true);

-- Allow admin insert/update/delete access to hero_slider_images
CREATE POLICY "Enable insert for admin users" ON hero_slider_images
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin users" ON hero_slider_images
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin users" ON hero_slider_images
  FOR DELETE USING (auth.role() = 'service_role');

-- 6. Create storage buckets if they don't exist
-- Note: This needs to be executed via Supabase dashboard or API
-- The following are the SQL commands you would run:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--   ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
--   ('uploads', 'uploads', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
-- ON CONFLICT (id) DO NOTHING;

-- 7. Create storage policies
-- Allow public access to read images
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('images', 'uploads'));

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('images', 'uploads') AND 
    auth.role() = 'service_role'
  );

-- Allow authenticated users to update images
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('images', 'uploads') AND 
    auth.role() = 'service_role'
  );

-- Allow authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('images', 'uploads') AND 
    auth.role() = 'service_role'
  );

-- 8. Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for automatic timestamp updates
CREATE TRIGGER update_slider_images_updated_at 
  BEFORE UPDATE ON slider_images 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hero_slider_images_updated_at 
  BEFORE UPDATE ON hero_slider_images 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
GRANT ALL ON slider_images TO authenticated;
GRANT ALL ON slider_images TO service_role;
GRANT SELECT ON slider_images TO anon;

GRANT ALL ON hero_slider_images TO authenticated;
GRANT ALL ON hero_slider_images TO service_role;
GRANT SELECT ON hero_slider_images TO anon;

-- Setup complete!
-- You can now:
-- 1. Upload banners through the admin panel
-- 2. They will appear in the hero slider on the homepage
-- 3. Images will be stored in Supabase Storage
