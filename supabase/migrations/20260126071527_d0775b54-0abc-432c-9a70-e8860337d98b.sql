-- Create audit_logs table for tracking role changes and sensitive operations
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (via triggers and edge functions)
-- No direct INSERT allowed for users - only through secure functions
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);

-- Function to create audit log entries (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values, p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Trigger function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'role_assigned',
      'user_roles',
      NEW.user_id::TEXT,
      NULL,
      jsonb_build_object('role', NEW.role, 'user_id', NEW.user_id),
      jsonb_build_object('performed_by', auth.uid())
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'role_removed',
      'user_roles',
      OLD.user_id::TEXT,
      jsonb_build_object('role', OLD.role, 'user_id', OLD.user_id),
      NULL,
      jsonb_build_object('performed_by', auth.uid())
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'role_updated',
      'user_roles',
      NEW.user_id::TEXT,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      jsonb_build_object('performed_by', auth.uid())
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role changes
CREATE TRIGGER audit_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_changes();

-- Trigger function to log webhook settings changes
CREATE OR REPLACE FUNCTION public.log_webhook_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'webhook_created',
      'webhook_settings',
      NEW.id::TEXT,
      NULL,
      jsonb_build_object('name', NEW.name, 'webhook_type', NEW.webhook_type, 'is_active', NEW.is_active),
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'webhook_deleted',
      'webhook_settings',
      OLD.id::TEXT,
      jsonb_build_object('name', OLD.name, 'webhook_type', OLD.webhook_type),
      NULL,
      NULL
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      'webhook_updated',
      'webhook_settings',
      NEW.id::TEXT,
      jsonb_build_object('name', OLD.name, 'is_active', OLD.is_active),
      jsonb_build_object('name', NEW.name, 'is_active', NEW.is_active),
      NULL
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for webhook settings changes
CREATE TRIGGER audit_webhook_changes
AFTER INSERT OR UPDATE OR DELETE ON public.webhook_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_webhook_changes();