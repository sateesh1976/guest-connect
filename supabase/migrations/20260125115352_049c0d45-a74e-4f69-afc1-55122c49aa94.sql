-- Drop existing policies that allow self-modification
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create new INSERT policy that prevents self-role-assignment
CREATE POLICY "Admins can insert roles for others"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
);

-- Create new DELETE policy that prevents self-role-deletion
CREATE POLICY "Admins can delete roles for others"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
);

-- Add UPDATE policy to prevent any direct updates (roles should be deleted and re-inserted)
CREATE POLICY "No direct role updates allowed"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);