import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DBVisitor {
  id: string;
  badge_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  company_name: string;
  host_name: string;
  host_email: string | null;
  purpose: string;
  check_in_time: string;
  check_out_time: string | null;
  status: 'checked-in' | 'checked-out';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
}

// Generate unique badge ID
const generateBadgeId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `V-${year}-${random}`;
};

export function useVisitorsDB() {
  const [visitors, setVisitors] = useState<DBVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVisitors = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('visitors')
        .select('*')
        .order('check_in_time', { ascending: false });

      if (fetchError) {
        console.error('Error fetching visitors:', fetchError);
        setError('Failed to load visitors');
        toast({
          title: 'Error',
          description: 'Failed to load visitors. Please try again.',
          variant: 'destructive',
        });
      } else {
        setVisitors(data as DBVisitor[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const addVisitor = async (formData: VisitorFormData): Promise<DBVisitor | null> => {
    if (!user) return null;

    const badgeId = generateBadgeId();
    
    const { data, error } = await supabase
      .from('visitors')
      .insert({
        badge_id: badgeId,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        email: formData.email || null,
        company_name: formData.companyName,
        host_name: formData.hostName,
        host_email: formData.hostEmail || null,
        purpose: formData.purpose,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding visitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in visitor',
        variant: 'destructive',
      });
      return null;
    }

    const newVisitor = data as DBVisitor;
    setVisitors(prev => [newVisitor, ...prev]);

    // Trigger webhook notification
    try {
      await supabase.functions.invoke('send-visitor-notification', {
        body: { visitor: newVisitor, eventType: 'checkin' }
      });
    } catch (webhookError) {
      console.error('Webhook notification failed:', webhookError);
    }

    // Trigger email notification
    try {
      await supabase.functions.invoke('send-visitor-email', {
        body: { visitor: newVisitor, eventType: 'checkin' }
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    toast({
      title: 'Success',
      description: `${formData.fullName} has been checked in`,
    });

    return newVisitor;
  };

  const checkOutVisitor = async (id: string): Promise<boolean> => {
    const visitor = visitors.find(v => v.id === id);
    if (!visitor) return false;

    const { error } = await supabase
      .from('visitors')
      .update({
        status: 'checked-out',
        check_out_time: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error checking out visitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out visitor',
        variant: 'destructive',
      });
      return false;
    }

    setVisitors(prev =>
      prev.map(v =>
        v.id === id
          ? { ...v, status: 'checked-out' as const, check_out_time: new Date().toISOString() }
          : v
      )
    );

    // Trigger webhook notification for checkout
    try {
      await supabase.functions.invoke('send-visitor-notification', {
        body: { visitor: { ...visitor, status: 'checked-out' }, eventType: 'checkout' }
      });
    } catch (webhookError) {
      console.error('Webhook notification failed:', webhookError);
    }

    toast({
      title: 'Checked Out',
      description: `${visitor.full_name} has been checked out`,
    });

    return true;
  };

  const getCheckedInCount = (): number => {
    return visitors.filter(v => v.status === 'checked-in').length;
  };

  const getTodayVisitorCount = (): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visitors.filter(v => new Date(v.check_in_time) >= today).length;
  };

  const findVisitorByBadgeId = (badgeId: string): DBVisitor | undefined => {
    return visitors.find(v => v.badge_id === badgeId);
  };

  return {
    visitors,
    isLoading,
    error,
    addVisitor,
    checkOutVisitor,
    getCheckedInCount,
    getTodayVisitorCount,
    findVisitorByBadgeId,
    refetch: fetchVisitors,
  };
}
