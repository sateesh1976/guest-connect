
-- Restrict visitor-photos bucket: replace public SELECT with authenticated-only SELECT
DROP POLICY IF EXISTS "Public can view visitor photos" ON storage.objects;
CREATE POLICY "Authenticated users can view visitor photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'visitor-photos');

-- Lock down SECURITY DEFINER helper / trigger functions that should not be user-callable
REVOKE EXECUTE ON FUNCTION public.create_audit_log(uuid, text, text, text, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log(uuid, text, text, text, jsonb, jsonb, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_webhook_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role / is_staff must remain callable by signed-in users because RLS policies invoke them
-- (evaluated in the caller's context). Revoke from anon only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
