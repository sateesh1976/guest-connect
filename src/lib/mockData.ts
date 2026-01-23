import { Visitor } from '@/types/visitor';

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const generateBadgeId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `V-${year}-${random}`;
};

export const mockVisitors: Visitor[] = [
  {
    id: '1',
    badgeId: 'V-2024-1001',
    fullName: 'Sarah Johnson',
    phoneNumber: '+1 555-0123',
    email: 'sarah.j@techcorp.com',
    companyName: 'TechCorp Solutions',
    hostName: 'Michael Chen',
    hostEmail: 'michael.chen@company.com',
    purpose: 'Product Demo Meeting',
    checkInTime: new Date('2024-01-21T09:30:00').toISOString(),
    status: 'checked-in',
  },
  {
    id: '2',
    badgeId: 'V-2024-1002',
    fullName: 'David Miller',
    phoneNumber: '+1 555-0456',
    email: 'dmiller@innovate.io',
    companyName: 'Innovate.io',
    hostName: 'Emily Rodriguez',
    hostEmail: 'emily.r@company.com',
    purpose: 'Partnership Discussion',
    checkInTime: new Date('2024-01-21T10:15:00').toISOString(),
    status: 'checked-in',
  },
  {
    id: '3',
    badgeId: 'V-2024-1003',
    fullName: 'Amanda Lee',
    phoneNumber: '+1 555-0789',
    companyName: 'Creative Studios',
    hostName: 'James Wilson',
    purpose: 'Design Review',
    checkInTime: new Date('2024-01-21T08:00:00').toISOString(),
    checkOutTime: new Date('2024-01-21T11:30:00').toISOString(),
    status: 'checked-out',
  },
  {
    id: '4',
    badgeId: 'V-2024-1004',
    fullName: 'Robert Chen',
    phoneNumber: '+1 555-0321',
    email: 'rchen@globaltech.com',
    companyName: 'GlobalTech Inc',
    hostName: 'Lisa Park',
    hostEmail: 'lisa.park@company.com',
    purpose: 'Technical Consultation',
    checkInTime: new Date('2024-01-20T14:00:00').toISOString(),
    checkOutTime: new Date('2024-01-20T16:45:00').toISOString(),
    status: 'checked-out',
  },
  {
    id: '5',
    badgeId: 'V-2024-1005',
    fullName: 'Jennifer White',
    phoneNumber: '+1 555-0654',
    email: 'jwhite@startup.co',
    companyName: 'Startup Co',
    hostName: 'Alex Thompson',
    purpose: 'Investor Meeting',
    checkInTime: new Date('2024-01-21T11:00:00').toISOString(),
    status: 'checked-in',
  },
];
