import { useState, ReactNode } from 'react';
import { format } from 'date-fns';
import { z } from 'zod';
import { 
  ScanLine, 
  CheckCircle2, 
  XCircle, 
  User, 
  Building, 
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRScanner } from './QRScanner';
import { cn } from '@/lib/utils';

// Schema for validating QR code data
const qrCodeSchema = z.object({
  type: z.literal('visitor-pass'),
  badgeId: z.string().min(1).max(50),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  host: z.string().max(200).optional(),
  checkIn: z.string().optional(),
});

type QRCodeData = z.infer<typeof qrCodeSchema>;

interface ScanResult {
  success: boolean;
  message: string;
  badgeId?: string;
  visitorName?: string;
  companyName?: string;
  checkInTime?: string;
}

interface ScannerDialogProps {
  onCheckOut: (badgeId: string) => Promise<boolean>;
  children?: ReactNode;
}

export function ScannerDialog({ onCheckOut, children }: ScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const handleScan = async (data: string) => {
    try {
      // Parse JSON with error handling
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        setScanResult({
          success: false,
          message: 'Invalid QR code - not valid JSON',
        });
        return;
      }

      // Validate QR code structure using zod
      const validationResult = qrCodeSchema.safeParse(parsed);
      
      if (!validationResult.success) {
        setScanResult({
          success: false,
          message: 'Invalid QR code format',
        });
        return;
      }

      const validatedData: QRCodeData = validationResult.data;

      // Try to check out the visitor
      const success = await onCheckOut(validatedData.badgeId);
      
      if (!success) {
        setScanResult({
          success: false,
          message: `Could not check out visitor ${validatedData.name || validatedData.badgeId}`,
          badgeId: validatedData.badgeId,
          visitorName: validatedData.name,
          companyName: validatedData.company,
          checkInTime: validatedData.checkIn,
        });
        return;
      }
      
      const result: ScanResult = {
        success: true,
        message: `${validatedData.name || 'Visitor'} checked out successfully`,
        badgeId: validatedData.badgeId,
        visitorName: validatedData.name,
        companyName: validatedData.company,
        checkInTime: validatedData.checkIn,
      };
      
      setScanResult(result);
      setRecentScans(prev => [result, ...prev].slice(0, 5));

    } catch {
      setScanResult({
        success: false,
        message: 'Could not read QR code data',
      });
    }
  };

  const clearResult = () => {
    setScanResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setScanResult(null);
      }
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <ScanLine className="w-4 h-4" />
            Scan QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            QR Code Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scan Result Feedback */}
          {scanResult && (
            <div 
              className={cn(
                'p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2',
                scanResult.success 
                  ? 'bg-success/10 border-success/20' 
                  : 'bg-destructive/10 border-destructive/20'
              )}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium',
                  scanResult.success ? 'text-success' : 'text-destructive'
                )}>
                  {scanResult.message}
                </p>
                {(scanResult.visitorName || scanResult.badgeId) && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {scanResult.visitorName && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{scanResult.visitorName}</span>
                      </div>
                    )}
                    {scanResult.companyName && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="w-3.5 h-3.5" />
                        <span className="truncate">{scanResult.companyName}</span>
                      </div>
                    )}
                    {scanResult.checkInTime && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Checked in {format(new Date(scanResult.checkInTime), 'h:mm a')}
                        </span>
                      </div>
                    )}
                    {scanResult.badgeId && (
                      <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                        {scanResult.badgeId}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearResult}
                className="flex-shrink-0"
              >
                Scan Next
              </Button>
            </div>
          )}

          {/* Scanner */}
          <QRScanner 
            onScan={handleScan}
            onError={(err) => console.error('Scanner error:', err)}
          />

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Recent Scans
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentScans.map((scan, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/50"
                  >
                    {scan.success ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate">{scan.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
