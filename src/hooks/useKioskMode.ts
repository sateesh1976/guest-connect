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

// Generate unique badge ID for kiosk mode with timestamp to minimize collisions
const generateKioskBadgeId = (): string => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900);
  return `K-${datePart}-${timePart}${random}`;
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
