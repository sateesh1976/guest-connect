import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'receptionist' | 'user';

export interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  created_at: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser, isAdmin } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    
    // Get all profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      toast({
        title: 'Error',
        description: 'Failed to load user roles',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const roleMap = new Map<string, AppRole>();
    roles.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

    const usersWithRoles: UserWithRole[] = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      role: roleMap.get(profile.id) || 'user',
      created_at: profile.created_at,
    }));

    setUsers(usersWithRoles);
    setIsLoading(false);
  }, [isAdmin, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: AppRole): Promise<boolean> => {
    // Validate inputs
    if (!userId || !newRole) {
      toast({
        title: 'Error',
        description: 'Invalid user ID or role specified.',
        variant: 'destructive',
      });
      return false;
    }

    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can change user roles.',
        variant: 'destructive',
      });
      return false;
    }

    if (userId === currentUser?.id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot change your own role.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Use delete + insert pattern to comply with RLS policy that blocks direct updates
      // This creates a proper audit trail with two separate events
      
      // Delete existing role first
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting role:', deleteError);
        toast({
          title: 'Error',
          description: 'Failed to update user role. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) {
        console.error('Error inserting role:', insertError);
        toast({
          title: 'Error',
          description: 'Failed to assign new role. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: 'Role Updated',
        description: 'User role has been updated successfully.',
      });

      return true;
    } catch (err) {
      console.error('Unexpected error updating role:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Invalid user ID specified.',
        variant: 'destructive',
      });
      return false;
    }

    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can deactivate users.',
        variant: 'destructive',
      });
      return false;
    }

    if (userId === currentUser?.id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot deactivate your own account.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Remove the user's role (effectively deactivating them)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user role:', error);
        toast({
          title: 'Error',
          description: 'Failed to deactivate user. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: 'user' as AppRole } : u))
      );

      toast({
        title: 'User Deactivated',
        description: 'User has been deactivated successfully.',
      });

      return true;
    } catch (err) {
      console.error('Unexpected error removing user:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    users,
    isLoading,
    updateUserRole,
    removeUser,
    refetch: fetchUsers,
  };
}
