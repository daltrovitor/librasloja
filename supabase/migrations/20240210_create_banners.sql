-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow everyone to view active banners
CREATE POLICY "Public banners are viewable by everyone" ON public.banners
    FOR SELECT USING (true);

-- Allow admins/managers to manage banners
-- Note with Service Role API access this isn't strictly needed for the API to work, 
-- but good for security if accessed via client directly.
CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role IN ('admin', 'manager')
        )
    );
