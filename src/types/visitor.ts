export interface Visitor {
  id: string;
  badgeId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string;
  photoUrl?: string;
  status: 'checked-in' | 'checked-out';
}

export interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
  photo?: File;
}

export interface WebhookPayload {
  visitor_name: string;
  company: string;
  host: string;
  purpose: string;
  check_in_time: string;
  check_out_time?: string;
}
