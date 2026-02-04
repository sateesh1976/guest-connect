-- Fix 1: Update visitors table RLS to restrict staff to visitors they created OR admins can see all
-- First drop the existing overly permissive policy
DROP POLICY IF EXISTS "Staff can view all visitors" ON public.visitors;

-- Create more restrictive policies:
-- Admins can view all visitors (needed for reporting and management)
CREATE POLICY "Admins can view all visitors" 
ON public.visitors 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff (receptionists) can only view visitors they created
CREATE POLICY "Staff can view visitors they created" 
ON public.visitors 
FOR SELECT 
USING (created_by = auth.uid());

-- Fix 2: Add missing SELECT policy for pre_registrations
-- Users can view their own pre-registrations (where they are the host)
CREATE POLICY "Users can view own pre-registrations" 
ON public.pre_registrations 
FOR SELECT 
USING (host_user_id = auth.uid());