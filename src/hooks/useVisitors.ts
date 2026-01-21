import { useState, useCallback } from 'react';
import { Visitor, VisitorFormData } from '@/types/visitor';
import { mockVisitors, generateId } from '@/lib/mockData';
import { toast } from 'sonner';

export function useVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors);

  const addVisitor = useCallback((formData: VisitorFormData): Visitor => {
    const newVisitor: Visitor = {
      id: generateId(),
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      companyName: formData.companyName,
      hostName: formData.hostName,
      hostEmail: formData.hostEmail,
      purpose: formData.purpose,
      checkInTime: new Date(),
      status: 'checked-in',
    };

    setVisitors(prev => [newVisitor, ...prev]);
    toast.success('Check-in successful!', {
      description: `Welcome, ${formData.fullName}. Your host has been notified.`,
    });

    return newVisitor;
  }, []);

  const checkOutVisitor = useCallback((id: string) => {
    setVisitors(prev =>
      prev.map(visitor =>
        visitor.id === id
          ? { ...visitor, status: 'checked-out' as const, checkOutTime: new Date() }
          : visitor
      )
    );
    toast.success('Check-out complete', {
      description: 'Thank you for visiting!',
    });
  }, []);

  const getCheckedInCount = useCallback(() => {
    return visitors.filter(v => v.status === 'checked-in').length;
  }, [visitors]);

  const getTodayVisitorCount = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visitors.filter(v => new Date(v.checkInTime) >= today).length;
  }, [visitors]);

  return {
    visitors,
    addVisitor,
    checkOutVisitor,
    getCheckedInCount,
    getTodayVisitorCount,
  };
}
