export type VisitorType = 'guest' | 'delivery' | 'cab' | 'service' | 'other';

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
  visitorType?: VisitorType;
  flatNumber?: string;
  vehicleNumber?: string;
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
  visitorType?: VisitorType;
  flatNumber?: string;
  vehicleNumber?: string;
}

export interface WebhookPayload {
  visitor_name: string;
  company: string;
  host: string;
  purpose: string;
  check_in_time: string;
  check_out_time?: string;
  visitor_type?: string;
  flat_number?: string;
  vehicle_number?: string;
}
