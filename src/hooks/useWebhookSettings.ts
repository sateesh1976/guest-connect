import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WebhookSetting {
  id: string;
  name: string;
  webhook_url: string;
  webhook_type: 'slack' | 'teams';
  is_active: boolean;
  notify_on_checkin: boolean;
  notify_on_checkout: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookFormData {
  name: string;
  webhookUrl: string;
  webhookType: 'slack' | 'teams';
  isActive: boolean;
  notifyOnCheckin: boolean;
  notifyOnCheckout: boolean;
}

export function useWebhookSettings() {
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchWebhooks = useCallback(async () => {
    if (!user || !isAdmin) {
      setWebhooks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('webhook_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
    } else {
      setWebhooks(data as WebhookSetting[]);
    }
    setIsLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const addWebhook = async (formData: WebhookFormData): Promise<WebhookSetting | null> => {
    if (!user || !isAdmin) return null;

    const { data, error } = await supabase
      .from('webhook_settings')
      .insert({
        name: formData.name,
        webhook_url: formData.webhookUrl,
        webhook_type: formData.webhookType,
        is_active: formData.isActive,
        notify_on_checkin: formData.notifyOnCheckin,
        notify_on_checkout: formData.notifyOnCheckout,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to add webhook',
        variant: 'destructive',
      });
      return null;
    }

    const newWebhook = data as WebhookSetting;
    setWebhooks(prev => [newWebhook, ...prev]);

    toast({
      title: 'Webhook Added',
      description: `${formData.name} has been configured`,
    });

    return newWebhook;
  };

  const updateWebhook = async (id: string, formData: Partial<WebhookFormData>): Promise<boolean> => {
    const updateData: Record<string, unknown> = {};
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.webhookUrl !== undefined) updateData.webhook_url = formData.webhookUrl;
    if (formData.webhookType !== undefined) updateData.webhook_type = formData.webhookType;
    if (formData.isActive !== undefined) updateData.is_active = formData.isActive;
    if (formData.notifyOnCheckin !== undefined) updateData.notify_on_checkin = formData.notifyOnCheckin;
    if (formData.notifyOnCheckout !== undefined) updateData.notify_on_checkout = formData.notifyOnCheckout;

    const { error } = await supabase
      .from('webhook_settings')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
      return false;
    }

    setWebhooks(prev =>
      prev.map(w =>
        w.id === id ? { ...w, ...updateData } as WebhookSetting : w
      )
    );

    toast({
      title: 'Webhook Updated',
      description: 'Settings have been saved',
    });

    return true;
  };

  const deleteWebhook = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('webhook_settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
      return false;
    }

    setWebhooks(prev => prev.filter(w => w.id !== id));

    toast({
      title: 'Webhook Deleted',
      description: 'Webhook has been removed',
    });

    return true;
  };

  return {
    webhooks,
    isLoading,
    addWebhook,
    updateWebhook,
    deleteWebhook,
    refetch: fetchWebhooks,
  };
}
