import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface PreRegistration {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  visitor_company: string | null;
  host_user_id: string;
  host_name: string;
  host_email: string | null;
  expected_date: string;
  expected_time: string | null;
  purpose: string | null;
  notes: string | null;
  status: 'pending' | 'checked-in' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface PreRegistrationFormData {
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_company?: string;
  expected_date: string;
  expected_time?: string;
  purpose?: string;
  notes?: string;
}

export function usePreRegistrations() {
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPreRegistrations = useCallback(async () => {
    if (!user) {
      setPreRegistrations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_registrations')
        .select('*')
        .order('expected_date', { ascending: true })
        .order('expected_time', { ascending: true })
        .limit(500);

      if (error) {
        console.error('Error fetching pre-registrations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pre-registrations. Please try again.',
          variant: 'destructive',
        });
        setPreRegistrations([]);
      } else {
        setPreRegistrations((data || []) as PreRegistration[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching pre-registrations:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setPreRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPreRegistrations();
  }, [fetchPreRegistrations]);

  const addPreRegistration = async (formData: PreRegistrationFormData): Promise<PreRegistration | null> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create pre-registrations.',
        variant: 'destructive',
      });
      return null;
    }

    // Validate expected date is not in the past
    const expectedDate = new Date(formData.expected_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expectedDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'Expected visit date cannot be in the past.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      const newPreReg = {
        visitor_name: formData.visitor_name.trim(),
        visitor_email: formData.visitor_email?.trim() || null,
        visitor_phone: formData.visitor_phone?.trim() || null,
        visitor_company: formData.visitor_company?.trim() || null,
        host_user_id: user.id,
        host_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown Host',
        host_email: profile?.email || user.email || null,
        expected_date: formData.expected_date,
        expected_time: formData.expected_time || null,
        purpose: formData.purpose?.trim() || null,
        notes: formData.notes?.trim() || null,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('pre_registrations')
        .insert(newPreReg)
        .select()
        .single();

      if (error) {
        console.error('Error adding pre-registration:', error);
        toast({
          title: 'Error',
          description: 'Failed to create pre-registration. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Success',
        description: 'Visitor pre-registered successfully',
      });

      const newReg = data as PreRegistration;
      setPreRegistrations(prev => [...prev, newReg].sort((a, b) => 
        new Date(a.expected_date).getTime() - new Date(b.expected_date).getTime()
      ));
      return newReg;
    } catch (err) {
      console.error('Unexpected error adding pre-registration:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePreRegistrationStatus = async (id: string, status: PreRegistration['status']): Promise<boolean> => {
    const { error } = await supabase
      .from('pre_registrations')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating pre-registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pre-registration',
        variant: 'destructive',
      });
      return false;
    }

    setPreRegistrations(prev =>
      prev.map(pr => (pr.id === id ? { ...pr, status } : pr))
    );

    toast({
      title: 'Updated',
      description: `Pre-registration marked as ${status}`,
    });

    return true;
  };

  const cancelPreRegistration = async (id: string): Promise<boolean> => {
    return updatePreRegistrationStatus(id, 'cancelled');
  };

  const getTodayPreRegistrations = () => {
    const today = new Date().toISOString().split('T')[0];
    return preRegistrations.filter(
      pr => pr.expected_date === today && pr.status === 'pending'
    );
  };

  const findPreRegistrationByName = (name: string) => {
    const today = new Date().toISOString().split('T')[0];
    return preRegistrations.find(
      pr =>
        pr.visitor_name.toLowerCase() === name.toLowerCase() &&
        pr.expected_date === today &&
        pr.status === 'pending'
    );
  };

  return {
    preRegistrations,
    isLoading,
    addPreRegistration,
    updatePreRegistrationStatus,
    cancelPreRegistration,
    getTodayPreRegistrations,
    findPreRegistrationByName,
    refetch: fetchPreRegistrations,
  };
}
