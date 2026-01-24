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
    if (!isAdmin || userId === currentUser?.id) {
      toast({
        title: 'Error',
        description: userId === currentUser?.id 
          ? 'You cannot change your own role'
          : 'Only admins can change roles',
        variant: 'destructive',
      });
      return false;
    }

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let error;

    if (existingRole) {
      // Update existing role
      const result = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      error = result.error;
    } else {
      // Insert new role
      const result = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      error = result.error;
    }

    if (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      return false;
    }

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );

    toast({
      title: 'Success',
      description: 'User role updated successfully',
    });

    return true;
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    if (!isAdmin || userId === currentUser?.id) {
      toast({
        title: 'Error',
        description: userId === currentUser?.id 
          ? 'You cannot remove yourself'
          : 'Only admins can remove users',
        variant: 'destructive',
      });
      return false;
    }

    // Remove the user's role (effectively deactivating them)
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate user',
        variant: 'destructive',
      });
      return false;
    }

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: 'user' as AppRole } : u))
    );

    toast({
      title: 'Success',
      description: 'User deactivated successfully',
    });

    return true;
  };

  return {
    users,
    isLoading,
    updateUserRole,
    removeUser,
    refetch: fetchUsers,
  };
}
