
-- Add visitor_type enum for categorizing visitors (MyGate/ApartmentAdda style)
CREATE TYPE public.visitor_type AS ENUM ('guest', 'delivery', 'cab', 'service', 'other');

-- Add new columns to visitors table for society management
ALTER TABLE public.visitors 
  ADD COLUMN visitor_type text NOT NULL DEFAULT 'guest',
  ADD COLUMN flat_number text,
  ADD COLUMN vehicle_number text;

-- Add same columns to pre_registrations for consistency
ALTER TABLE public.pre_registrations
  ADD COLUMN visitor_type text NOT NULL DEFAULT 'guest',
  ADD COLUMN flat_number text;
