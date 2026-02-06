-- Fix: Restrict visitor UPDATE to owner or admin only
-- This prevents receptionists from modifying visitor records they didn't create

DROP POLICY IF EXISTS "Staff can update visitors" ON public.visitors;

CREATE POLICY "Admins or creator can update visitors"
ON public.visitors FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  created_by = auth.uid()
);