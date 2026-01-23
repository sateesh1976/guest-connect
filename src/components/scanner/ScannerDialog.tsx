import { useState } from 'react';
import { format } from 'date-fns';
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
import { Visitor } from '@/types/visitor';
import { cn } from '@/lib/utils';

interface ScanResult {
  success: boolean;
  message: string;
  visitor?: Visitor;
}

interface ScannerDialogProps {
  visitors: Visitor[];
  onCheckOut: (id: string) => void;
  trigger?: React.ReactNode;
}

export function ScannerDialog({ visitors, onCheckOut, trigger }: ScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const handleScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      // Validate QR data structure
      if (!parsed.id || parsed.type !== 'visitor-pass') {
        setScanResult({
          success: false,
          message: 'Invalid QR code format',
        });
        return;
      }

      // Find visitor
      const visitor = visitors.find(v => v.id === parsed.id);
      
      if (!visitor) {
        setScanResult({
          success: false,
          message: 'Visitor not found in system',
        });
        return;
      }

      if (visitor.status === 'checked-out') {
        setScanResult({
          success: false,
          message: `${visitor.fullName} is already checked out`,
          visitor,
        });
        return;
      }

      // Check out the visitor
      onCheckOut(visitor.id);
      
      const result: ScanResult = {
        success: true,
        message: `${visitor.fullName} checked out successfully`,
        visitor,
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
        {trigger || (
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
                {scanResult.visitor && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{scanResult.visitor.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building className="w-3.5 h-3.5" />
                      <span className="truncate">{scanResult.visitor.companyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Checked in {format(new Date(scanResult.visitor.checkInTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                      {scanResult.visitor.badgeId}
                    </div>
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
