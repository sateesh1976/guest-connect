-- Add photo_url column to visitors table
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('visitor-photos', 'visitor-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload visitor photos
CREATE POLICY "Staff can upload visitor photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'visitor-photos' AND (SELECT is_staff(auth.uid())));

-- Allow public read access to visitor photos
CREATE POLICY "Public can view visitor photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'visitor-photos');

-- Allow staff to delete visitor photos
CREATE POLICY "Staff can delete visitor photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'visitor-photos' AND (SELECT is_staff(auth.uid())));