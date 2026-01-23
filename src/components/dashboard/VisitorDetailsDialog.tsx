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
  LogOut
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {visitor.photoUrl ? (
                <img 
                  src={visitor.photoUrl} 
                  alt={visitor.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
              <User className="w-6 h-6 text-primary" />
            )}
            </div>
            <div>
              <p className="text-lg font-semibold">{visitor.fullName}</p>
              <div className="flex items-center gap-2 mt-1">
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
                <span className="text-xs font-mono text-muted-foreground">
                  {visitor.badgeId}
                </span>
              </div>
            </div>
          </DialogTitle>
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

          {/* Company & Host */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div className="flex items-start gap-3">
              <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
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
