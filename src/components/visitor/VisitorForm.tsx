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
  Loader2,
  Car,
  Home,
  Package,
  Wrench,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Visitor } from '@/types/visitor';
import { VisitorQRCode } from './VisitorQRCode';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VisitorFormData {
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName: string;
  hostName: string;
  hostEmail?: string;
  purpose: string;
  visitorType?: string;
  flatNumber?: string;
  vehicleNumber?: string;
}

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phoneNumber: z.string().trim().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
  email: z.string().trim().email('Please enter a valid email').max(255).optional().or(z.literal('')),
  companyName: z.string().trim().min(2, 'Company name is required').max(100, 'Company name is too long'),
  hostName: z.string().trim().min(2, 'Host name is required').max(100, 'Host name is too long'),
  hostEmail: z.string().trim().email('Please enter a valid email').max(255).optional().or(z.literal('')),
  purpose: z.string().trim().min(5, 'Please describe your purpose of visit').max(500, 'Purpose is too long'),
  visitorType: z.enum(['guest', 'delivery', 'cab', 'service', 'other']).default('guest'),
  flatNumber: z.string().trim().max(20, 'Flat number is too long').optional().or(z.literal('')),
  vehicleNumber: z.string().trim().max(20, 'Vehicle number is too long').optional().or(z.literal('')),
});

interface VisitorFormProps {
  onSubmit: (data: VisitorFormData) => Visitor | Promise<Visitor>;
}

const visitorTypes = [
  { value: 'guest', label: 'Guest', icon: Users, description: 'Personal visitor' },
  { value: 'delivery', label: 'Delivery', icon: Package, description: 'Package / food delivery' },
  { value: 'cab', label: 'Cab / Ride', icon: Car, description: 'Taxi, Uber, Ola' },
  { value: 'service', label: 'Service', icon: Wrench, description: 'Plumber, electrician, etc.' },
  { value: 'other', label: 'Other', icon: User, description: 'Other visitor type' },
];

export function VisitorForm({ onSubmit }: VisitorFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVisitor, setCreatedVisitor] = useState<Visitor | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    
    if (!file) return;
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Please upload a valid image (JPEG, PNG, or WebP)');
      return;
    }
    
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
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
      visitorType: 'guest',
      flatNumber: '',
      vehicleNumber: '',
    },
    mode: 'onBlur',
  });

  const selectedType = form.watch('visitorType');

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
        visitorType: values.visitorType,
        flatNumber: values.flatNumber?.trim() || undefined,
        vehicleNumber: values.vehicleNumber?.trim() || undefined,
      };
      const visitor = await onSubmit(formData);
      setCreatedVisitor(visitor);
      setIsSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      form.setError('root', { message: `Check-in failed: ${errorMessage}` });
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
            <VisitorQRCode visitor={createdVisitor} />

            <div className="bg-secondary/50 rounded-xl p-6 min-w-[250px]">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Visit Details
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Visitor</p>
                  <p className="font-medium text-foreground">{createdVisitor.fullName}</p>
                </div>
                {createdVisitor.visitorType && (
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground capitalize">{createdVisitor.visitorType}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-medium text-foreground">{createdVisitor.companyName}</p>
                </div>
                {createdVisitor.flatNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Flat / Unit</p>
                    <p className="font-medium text-foreground">{createdVisitor.flatNumber}</p>
                  </div>
                )}
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
                {createdVisitor.vehicleNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="font-medium text-foreground">{createdVisitor.vehicleNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Button onClick={handleNewCheckIn} className="btn-primary">
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

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
        {/* Form Error Display */}
        {form.formState.errors.root && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Visitor Type Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Visitor Type *
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {visitorTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => form.setValue('visitorType', type.value as any)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
              placeholder="+91 98765 43210" 
              className="input-focus"
              autoComplete="tel"
              {...form.register('phoneNumber')}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="flatNumber" className="flex items-center gap-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              Flat / Unit No.
            </Label>
            <Input 
              id="flatNumber"
              placeholder="A-101, B-202" 
              className="input-focus"
              {...form.register('flatNumber')}
            />
            {form.formState.errors.flatNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.flatNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNumber" className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              Vehicle Number (Optional)
            </Label>
            <Input 
              id="vehicleNumber"
              placeholder="MH 01 AB 1234" 
              className="input-focus"
              {...form.register('vehicleNumber')}
            />
            {form.formState.errors.vehicleNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.vehicleNumber.message}</p>
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
              Company / From *
            </Label>
            <Input 
              id="companyName"
              placeholder="Acme Corp / Swiggy / Self" 
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
              placeholder="Resident / Host name" 
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
              placeholder="resident@email.com" 
              className="input-focus"
              {...form.register('hostEmail')}
            />
            {form.formState.errors.hostEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.hostEmail.message}</p>
            )}
          </div>
        </div>

        {/* Photo Capture */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            Photo (Optional)
          </Label>
          <div className="flex items-center gap-4">
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
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-secondary/30"
                aria-label="Capture photo"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Capture</span>
              </button>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" aria-hidden="true" />
            <div className="flex-1 space-y-1">
              {photoPreview && (
                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-1" />
                  Retake
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Tap to capture visitor photo (max 5MB)
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