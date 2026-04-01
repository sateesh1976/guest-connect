import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SocietyMember {
  id: string;
  member_id: string;
  member_name: string;
  contact_number: string | null;
  ownership_type: string;
  validity: string | null;
  cluster_name: string | null;
  wing: string | null;
  flat_no: string;
  email_address: string | null;
  role: string | null;
  created_at: string;
}

export function useSocietyMembers() {
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchMembers = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('society_members')
        .select('*')
        .order('member_id', { ascending: true });

      if (!error && data) {
        setMembers(data as SocietyMember[]);
      }
    } catch (err) {
      console.error('Error fetching society members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, isLoading, refetch: fetchMembers };
}
