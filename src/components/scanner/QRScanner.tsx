import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QRScanner({ onScan, onError, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          // Don't stop scanner automatically - let user scan multiple
        },
        () => {
          // Ignore scan failures (no QR in frame)
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scanner';
      setError(errorMessage);
      setHasPermission(false);
      onError?.(errorMessage);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className={cn('flex flex-col items-center', className)} role="region" aria-label="QR code scanner">
      {/* Scanner Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-secondary/50 border border-border"
      >
        <div 
          id="qr-scanner-container" 
          className={cn(
            'w-full h-full',
            !isScanning && 'flex items-center justify-center'
          )}
          aria-live="polite"
        >
          {!isScanning && (
            <div className="text-center p-6">
              {error ? (
                <div className="space-y-3">
                  <CameraOff className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground" role="alert">{error}</p>
                  <Button onClick={startScanner} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Click start to activate camera
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary rounded-xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        {!isScanning ? (
          <Button onClick={startScanner} className="gap-2">
            <Camera className="w-4 h-4" aria-hidden="true" />
            Start Scanner
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" className="gap-2">
            <CameraOff className="w-4 h-4" aria-hidden="true" />
            Stop Scanner
          </Button>
        )}
      </div>

      {/* Instructions */}
      <p className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        Point the camera at a visitor's QR code to automatically check them out
      </p>
    </div>
  );
}
