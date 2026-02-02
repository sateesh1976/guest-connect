import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  UserCheck, 
  FileText,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Camera,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Visitor } from '@/types/visitor';
import { VisitorQRCode } from './VisitorQRCode';
import { format } from 'date-fns';

interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
}

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phoneNumber: z.string().trim().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
  email: z.string().trim().email('Please enter a valid email').max(255).optional().or(z.literal('')),
  companyName: z.string().trim().min(2, 'Company name is required').max(100, 'Company name is too long'),
  hostName: z.string().trim().min(2, 'Host name is required').max(100, 'Host name is too long'),
  hostEmail: z.string().trim().email('Please enter a valid email').max(255).optional().or(z.literal('')),
  purpose: z.string().trim().min(5, 'Please describe your purpose of visit').max(500, 'Purpose is too long'),
});

interface VisitorFormProps {
  onSubmit: (data: VisitorFormData) => Visitor | Promise<Visitor>;
}

export function VisitorForm({ onSubmit }: VisitorFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVisitor, setCreatedVisitor] = useState<Visitor | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    
    if (!file) return;
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Please upload a valid image (JPEG, PNG, or WebP)');
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      email: '',
      companyName: '',
      hostName: '',
      hostEmail: '',
      purpose: '',
    },
    mode: 'onBlur',
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData: VisitorFormData = {
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        companyName: values.companyName.trim(),
        hostName: values.hostName.trim(),
        purpose: values.purpose.trim(),
        email: values.email?.trim() || undefined,
        hostEmail: values.hostEmail?.trim() || undefined,
      };
      const visitor = await onSubmit(formData);
      setCreatedVisitor(visitor);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewCheckIn = () => {
    form.reset();
    setIsSubmitted(false);
    setCreatedVisitor(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  if (isSubmitted && createdVisitor) {
    return (
      <div className="card-elevated p-8 md:p-12 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome, {createdVisitor.fullName}!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You've been successfully checked in. Your host has been notified.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Your Visitor Pass</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
            {/* QR Code */}
            <VisitorQRCode visitor={createdVisitor} />

            {/* Visit Details */}
            <div className="bg-secondary/50 rounded-xl p-6 min-w-[250px]">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Visit Details
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Visitor</p>
                  <p className="font-medium text-foreground">{createdVisitor.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-medium text-foreground">{createdVisitor.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visiting</p>
                  <p className="font-medium text-foreground">{createdVisitor.hostName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(createdVisitor.checkInTime), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(createdVisitor.checkInTime), 'h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Purpose</p>
                  <p className="font-medium text-foreground text-sm">{createdVisitor.purpose}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Check-in Button */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <Button 
            onClick={handleNewCheckIn}
            className="btn-primary"
          >
            New Check-in
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 md:p-8 fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Visitor Check-in
        </h2>
        <p className="text-muted-foreground">
          Please fill in your details to check in
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Full Name *
            </Label>
            <Input 
              id="fullName"
              placeholder="John Smith" 
              className="input-focus"
              autoComplete="name"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Phone Number *
            </Label>
            <Input 
              id="phoneNumber"
              placeholder="+1 555-0123" 
              className="input-focus"
              autoComplete="tel"
              {...form.register('phoneNumber')}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email (Optional)
            </Label>
            <Input 
              id="email"
              type="email"
              placeholder="john@company.com" 
              className="input-focus"
              autoComplete="email"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              Company Name *
            </Label>
            <Input 
              id="companyName"
              placeholder="Acme Corporation" 
              className="input-focus"
              autoComplete="organization"
              {...form.register('companyName')}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostName" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              Person to Visit *
            </Label>
            <Input 
              id="hostName"
              placeholder="Jane Doe" 
              className="input-focus"
              {...form.register('hostName')}
            />
            {form.formState.errors.hostName && (
              <p className="text-sm text-destructive">{form.formState.errors.hostName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Host Email (Optional)
            </Label>
            <Input 
              id="hostEmail"
              type="email"
              placeholder="jane.doe@company.com" 
              className="input-focus"
              {...form.register('hostEmail')}
            />
            {form.formState.errors.hostEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.hostEmail.message}</p>
            )}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            Photo (Optional)
          </Label>
          <div className="flex items-start gap-4">
            {photoPreview ? (
              <div className="relative shrink-0">
                <img 
                  src={photoPreview} 
                  alt="Visitor preview" 
                  className="w-20 h-20 rounded-xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-secondary/30"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload photo"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {/* Hidden file input for gallery upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handlePhotoChange}
                className="hidden"
                aria-hidden="true"
              />
              {/* Camera capture input - uses capture attribute for mobile */}
              <input
                ref={cameraInputRef}
                id="camera-capture"
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="hidden"
                aria-hidden="true"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {photoPreview ? 'Change' : 'Upload'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Capture directly or upload from device (max 5MB)
              </p>
              {photoError && (
                <p className="text-sm text-destructive">{photoError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Purpose of Visit *
          </Label>
          <Textarea 
            id="purpose"
            placeholder="Describe the purpose of your visit..."
            className="input-focus min-h-[100px] resize-none"
            {...form.register('purpose')}
          />
          {form.formState.errors.purpose && (
            <p className="text-sm text-destructive">{form.formState.errors.purpose.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary h-12 text-base font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Check-in
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
