import { useCallback } from 'react';
import { toast } from 'sonner';
import { Visitor } from '@/types/visitor';

export interface KioskFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
}

// Generate unique badge ID for kiosk mode
const generateKioskBadgeId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `K-${year}-${random}`;
};

export function useKioskMode() {
  const checkInVisitor = useCallback(async (formData: KioskFormData): Promise<Visitor> => {
    // Simulate a small delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    const visitor: Visitor = {
      id: crypto.randomUUID(),
      badgeId: generateKioskBadgeId(),
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email?.trim() || undefined,
      companyName: formData.companyName.trim(),
      hostName: formData.hostName.trim(),
      hostEmail: formData.hostEmail?.trim() || undefined,
      purpose: formData.purpose.trim(),
      checkInTime: new Date().toISOString(),
      status: 'checked-in',
    };

    toast.success('Check-in successful!', {
      description: `Welcome, ${visitor.fullName}. Your host has been notified.`,
    });

    return visitor;
  }, []);

  return {
    checkInVisitor,
  };
}
