-- Create the pre_registrations table
CREATE TABLE public.pre_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  visitor_phone TEXT,
  visitor_company TEXT,
  host_user_id UUID NOT NULL,
  host_name TEXT NOT NULL,
  host_email TEXT,
  expected_date DATE NOT NULL,
  expected_time TIME,
  purpose TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked-in', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- Staff can view all pre-registrations
CREATE POLICY "Staff can view all pre-registrations"
ON public.pre_registrations
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Authenticated users can create pre-registrations for themselves as host
CREATE POLICY "Users can create pre-registrations"
ON public.pre_registrations
FOR INSERT
TO authenticated
WITH CHECK (host_user_id = auth.uid());

-- Users can update their own pre-registrations
CREATE POLICY "Users can update own pre-registrations"
ON public.pre_registrations
FOR UPDATE
TO authenticated
USING (host_user_id = auth.uid());

-- Staff can update any pre-registration (for check-in process)
CREATE POLICY "Staff can update any pre-registrations"
ON public.pre_registrations
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()));

-- Users can cancel (delete) their own pre-registrations
CREATE POLICY "Users can delete own pre-registrations"
ON public.pre_registrations
FOR DELETE
TO authenticated
USING (host_user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pre_registrations_updated_at
BEFORE UPDATE ON public.pre_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();