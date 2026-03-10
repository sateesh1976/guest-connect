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
  visitor_type: string;
  flat_number: string | null;
  vehicle_number: string | null;
}

export interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
  visitorType?: string;
  flatNumber?: string;
  vehicleNumber?: string;
}

// Generate unique badge ID with timestamp component to minimize collisions
const generateBadgeId = (): string => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900);
  return `V-${datePart}-${timePart}${random}`;
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
      setVisitors([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('visitors')
        .select('*')
        .order('check_in_time', { ascending: false })
        .limit(500);

      if (fetchError) {
        console.error('Error fetching visitors:', fetchError);
        setError('Failed to load visitors. Please check your connection and try again.');
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
      setError('An unexpected error occurred. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const addVisitor = async (formData: VisitorFormData): Promise<DBVisitor | null> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to check in visitors.',
        variant: 'destructive',
      });
      return null;
    }

    const badgeId = generateBadgeId();
    
    try {
      const { data, error } = await supabase
        .from('visitors')
        .insert({
          badge_id: badgeId,
          full_name: formData.fullName.trim(),
          phone_number: formData.phoneNumber.trim(),
          email: formData.email?.trim() || null,
          company_name: formData.companyName.trim(),
          host_name: formData.hostName.trim(),
          host_email: formData.hostEmail?.trim() || null,
          purpose: formData.purpose.trim(),
          created_by: user.id,
          visitor_type: formData.visitorType || 'guest',
          flat_number: formData.flatNumber?.trim() || null,
          vehicle_number: formData.vehicleNumber?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding visitor:', error);
        toast({
          title: 'Error',
          description: 'Failed to check in visitor. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      const newVisitor = data as DBVisitor;
      setVisitors(prev => [newVisitor, ...prev]);

      // Trigger notifications in parallel (fire-and-forget)
      Promise.allSettled([
        supabase.functions.invoke('send-visitor-notification', {
          body: { visitor: newVisitor, eventType: 'checkin' }
        }).catch(err => console.error('Webhook notification failed:', err)),
        supabase.functions.invoke('send-visitor-email', {
          body: { visitor: newVisitor, eventType: 'checkin' }
        }).catch(err => console.error('Email notification failed:', err)),
      ]);

      toast({
        title: 'Success',
        description: `${formData.fullName} has been checked in`,
      });

      return newVisitor;
    } catch (err) {
      console.error('Unexpected error adding visitor:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const checkOutVisitor = async (id: string): Promise<boolean> => {
    const visitor = visitors.find(v => v.id === id);
    if (!visitor) {
      toast({
        title: 'Error',
        description: 'Visitor not found.',
        variant: 'destructive',
      });
      return false;
    }

    if (visitor.status === 'checked-out') {
      toast({
        title: 'Already Checked Out',
        description: `${visitor.full_name} has already been checked out.`,
      });
      return false;
    }

    try {
      const checkOutTime = new Date().toISOString();
      const { error } = await supabase
        .from('visitors')
        .update({
          status: 'checked-out',
          check_out_time: checkOutTime,
        })
        .eq('id', id);

      if (error) {
        console.error('Error checking out visitor:', error);
        toast({
          title: 'Error',
          description: 'Failed to check out visitor. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      setVisitors(prev =>
        prev.map(v =>
          v.id === id
            ? { ...v, status: 'checked-out' as const, check_out_time: checkOutTime }
            : v
        )
      );

      // Trigger webhook notification for checkout (fire-and-forget)
      supabase.functions.invoke('send-visitor-notification', {
        body: { visitor: { ...visitor, status: 'checked-out', check_out_time: checkOutTime }, eventType: 'checkout' }
      }).catch(err => console.error('Webhook notification failed:', err));

      toast({
        title: 'Checked Out',
        description: `${visitor.full_name} has been checked out`,
      });

      return true;
    } catch (err) {
      console.error('Unexpected error checking out visitor:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getCheckedInCount = useCallback((): number => {
    return visitors.filter(v => v.status === 'checked-in').length;
  }, [visitors]);

  const getTodayVisitorCount = useCallback((): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visitors.filter(v => new Date(v.check_in_time) >= today).length;
  }, [visitors]);

  const findVisitorByBadgeId = useCallback((badgeId: string): DBVisitor | undefined => {
    return visitors.find(v => v.badge_id === badgeId && v.status === 'checked-in');
  }, [visitors]);

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
