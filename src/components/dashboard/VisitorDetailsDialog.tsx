import { format } from 'date-fns';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  UserCheck, 
  FileText,
  Clock,
  LogIn,
  LogOut,
  Home,
  Car,
  Package,
  Wrench,
  Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Visitor } from '@/types/visitor';
import { cn } from '@/lib/utils';

interface VisitorDetailsDialogProps {
  visitor: Visitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig: Record<string, { label: string; icon: typeof Users; className: string }> = {
  guest: { label: 'Guest', icon: Users, className: 'bg-primary/10 text-primary border-primary/20' },
  delivery: { label: 'Delivery', icon: Package, className: 'bg-accent/10 text-accent border-accent/20' },
  cab: { label: 'Cab / Ride', icon: Car, className: 'bg-warning/10 text-warning border-warning/20' },
  service: { label: 'Service', icon: Wrench, className: 'bg-success/10 text-success border-success/20' },
  other: { label: 'Other', icon: User, className: 'bg-muted text-muted-foreground border-border' },
};

export function VisitorDetailsDialog({ visitor, open, onOpenChange }: VisitorDetailsDialogProps) {
  if (!visitor) return null;

  const duration = visitor.checkOutTime
    ? Math.round((new Date(visitor.checkOutTime).getTime() - new Date(visitor.checkInTime).getTime()) / 60000)
    : null;

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const vType = typeConfig[visitor.visitorType || 'guest'] || typeConfig.guest;
  const TypeIcon = vType.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="visitor-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {visitor.photoUrl ? (
                <img 
                  src={visitor.photoUrl} 
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{visitor.fullName}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge 
                  variant="outline"
                  className={cn(
                    "font-medium text-xs",
                    visitor.status === 'checked-in' 
                      ? 'status-checked-in' 
                      : 'status-checked-out'
                  )}
                >
                  {visitor.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                </Badge>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', vType.className)}>
                  <TypeIcon className="w-3 h-3" />
                  {vType.label}
                </span>
              </div>
            </div>
          </DialogTitle>
          <p id="visitor-details-description" className="sr-only">
            Visitor details for {visitor.fullName} from {visitor.companyName}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{visitor.phoneNumber}</p>
              </div>
            </div>
            {visitor.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{visitor.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Flat & Vehicle */}
          {(visitor.flatNumber || visitor.vehicleNumber) && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              {visitor.flatNumber && (
                <div className="flex items-start gap-3">
                  <Home className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Flat / Unit</p>
                    <p className="text-sm font-medium">{visitor.flatNumber}</p>
                  </div>
                </div>
              )}
              {visitor.vehicleNumber && (
                <div className="flex items-start gap-3">
                  <Car className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-medium">{visitor.vehicleNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company & Host */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div className="flex items-start gap-3">
              <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Company / From</p>
                <p className="text-sm font-medium">{visitor.companyName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="text-sm font-medium">{visitor.hostName}</p>
                {visitor.hostEmail && (
                  <p className="text-xs text-muted-foreground">{visitor.hostEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Purpose of Visit</p>
                <p className="text-sm font-medium">{visitor.purpose}</p>
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div className="pt-3 border-t border-border bg-secondary/30 -mx-6 px-6 py-4 -mb-6 rounded-b-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <LogIn className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="text-sm font-medium">
                    {format(new Date(visitor.checkInTime), 'h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(visitor.checkInTime), 'MMM d')}
                  </p>
                </div>
              </div>
              
              {visitor.checkOutTime && (
                <div className="flex items-start gap-2">
                  <LogOut className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="text-sm font-medium">
                      {format(new Date(visitor.checkOutTime), 'h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(visitor.checkOutTime), 'MMM d')}
                    </p>
                  </div>
                </div>
              )}
              
              {duration !== null && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{formatDuration(duration)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
