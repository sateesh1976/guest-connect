import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  photoPreview: string | null;
  onCapture: (dataUrl: string) => void;
  onClear: () => void;
  error?: string | null;
}

export function CameraCapture({ photoPreview, onCapture, onClear, error }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setIsCameraLoading(true);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported on this device/browser');
      setIsCameraLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOpen(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another application.');
      } else {
        setCameraError('Could not access camera. Please try again.');
      }
    } finally {
      setIsCameraLoading(false);
    }
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    onCapture(dataUrl);
    stopCamera();
  }, [onCapture, stopCamera]);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (isCameraOpen) {
      startCamera(newFacing);
    }
  }, [facingMode, isCameraOpen, startCamera]);

  const handleRetake = useCallback(() => {
    onClear();
    startCamera();
  }, [onClear, startCamera]);

  // Live camera viewfinder
  if (isCameraOpen) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[300px] object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={switchCamera}
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Switch camera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Close camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Button
          type="button"
          onClick={capturePhoto}
          className="w-full"
          size="lg"
        >
          <Camera className="w-5 h-5 mr-2" />
          Take Photo
        </Button>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Photo preview
  if (photoPreview) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={photoPreview}
            alt="Visitor preview"
            className="w-20 h-20 rounded-xl object-cover border border-border"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Retake
          </Button>
          <p className="text-xs text-muted-foreground">Photo captured</p>
        </div>
      </div>
    );
  }

  // Default state — open camera button
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => startCamera()}
        disabled={isCameraLoading}
        className={cn(
          'w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors',
          'border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50',
          isCameraLoading && 'opacity-60 cursor-wait'
        )}
        aria-label="Open camera to capture photo"
      >
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Camera className="w-6 h-6 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">
            {isCameraLoading ? 'Opening camera…' : 'Capture Photo'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tap to open camera and take a visitor photo
          </p>
        </div>
      </button>
      {(cameraError || error) && (
        <p className="text-sm text-destructive">{cameraError || error}</p>
      )}
    </div>
  );
}
