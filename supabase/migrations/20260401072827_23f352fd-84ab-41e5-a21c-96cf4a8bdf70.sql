
-- Add product_type to visitors table
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'office';

-- Create society_members table
CREATE TABLE IF NOT EXISTS public.society_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL UNIQUE,
  member_name text NOT NULL,
  contact_number text,
  ownership_type text NOT NULL DEFAULT 'Owner',
  validity text,
  cluster_name text,
  wing text,
  flat_no text NOT NULL,
  email_address text,
  role text DEFAULT 'Member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;

-- Staff can view all members
CREATE POLICY "Staff can view society members"
ON public.society_members FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Admins can manage members
CREATE POLICY "Admins can insert society members"
ON public.society_members FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update society members"
ON public.society_members FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete society members"
ON public.society_members FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update trigger for updated_at
CREATE TRIGGER update_society_members_updated_at
  BEFORE UPDATE ON public.society_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
