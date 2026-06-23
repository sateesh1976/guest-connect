
-- 1. Drop misleading audit_logs insert policy (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- 2. Re-scope visitors SELECT/UPDATE policies to authenticated only
DROP POLICY IF EXISTS "Admins can view all visitors" ON public.visitors;
DROP POLICY IF EXISTS "Staff can view visitors they created" ON public.visitors;
DROP POLICY IF EXISTS "Admins or creator can update visitors" ON public.visitors;

-- 3. Move has_role / is_staff to a private schema so they are not in the public Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'receptionist')
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

-- 4. Recreate ALL policies that referenced public.has_role / public.is_staff to use the private versions.

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert roles for others" ON public.user_roles;
CREATE POLICY "Admins can insert roles for others" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) AND user_id <> auth.uid());

DROP POLICY IF EXISTS "Admins can delete roles for others" ON public.user_roles;
CREATE POLICY "Admins can delete roles for others" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) AND user_id <> auth.uid());

-- visitors
CREATE POLICY "Admins can view all visitors" ON public.visitors
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Staff can view visitors they created" ON public.visitors
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins or creator can update visitors" ON public.visitors
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Staff can insert visitors" ON public.visitors;
CREATE POLICY "Staff can insert visitors" ON public.visitors
  FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));

-- audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- webhook_settings
DROP POLICY IF EXISTS "Admins can view webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can view webhook settings" ON public.webhook_settings
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can insert webhook settings" ON public.webhook_settings
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can update webhook settings" ON public.webhook_settings
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can delete webhook settings" ON public.webhook_settings
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- pre_registrations
DROP POLICY IF EXISTS "Staff can view all pre-registrations" ON public.pre_registrations;
CREATE POLICY "Staff can view all pre-registrations" ON public.pre_registrations
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update any pre-registrations" ON public.pre_registrations;
CREATE POLICY "Staff can update any pre-registrations" ON public.pre_registrations
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()));

-- society_members
DROP POLICY IF EXISTS "Staff can view society members" ON public.society_members;
CREATE POLICY "Staff can view society members" ON public.society_members
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert society members" ON public.society_members;
CREATE POLICY "Admins can insert society members" ON public.society_members
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update society members" ON public.society_members;
CREATE POLICY "Admins can update society members" ON public.society_members
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete society members" ON public.society_members;
CREATE POLICY "Admins can delete society members" ON public.society_members
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Tighten visitor-photos bucket: only staff can read/list, only staff can upload/delete.
DROP POLICY IF EXISTS "Authenticated users can view visitor photos" ON storage.objects;
CREATE POLICY "Staff can view visitor photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visitor-photos' AND private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can upload visitor photos" ON storage.objects;
CREATE POLICY "Staff can upload visitor photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visitor-photos' AND private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can delete visitor photos" ON storage.objects;
CREATE POLICY "Staff can delete visitor photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'visitor-photos' AND private.is_staff(auth.uid()));

-- 6. Drop the now-unused public copies so the linter no longer flags them.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff(uuid);
