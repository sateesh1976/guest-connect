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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Visitor, VisitorFormData } from '@/types/visitor';
import { VisitorQRCode } from './VisitorQRCode';
import { format } from 'date-fns';

const formSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  companyName: z.string().min(2, 'Company name is required').max(100),
  hostName: z.string().min(2, 'Host name is required').max(100),
  hostEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  purpose: z.string().min(5, 'Please describe your purpose of visit').max(500),
});

interface VisitorFormProps {
  onSubmit: (data: VisitorFormData) => Visitor;
}

export function VisitorForm({ onSubmit }: VisitorFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdVisitor, setCreatedVisitor] = useState<Visitor | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const formData: VisitorFormData = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      companyName: values.companyName,
      hostName: values.hostName,
      purpose: values.purpose,
      email: values.email || undefined,
      hostEmail: values.hostEmail || undefined,
    };
    const visitor = onSubmit(formData);
    setCreatedVisitor(visitor);
    setIsSubmitted(true);
  };

  const handleNewCheckIn = () => {
    form.reset();
    setIsSubmitted(false);
    setCreatedVisitor(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Smith" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Phone Number *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+1 555-0123" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="john@company.com" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    Company Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Acme Corporation" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hostName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    Person to Visit *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jane Doe" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hostEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Host Email (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="jane.doe@company.com" 
                      className="input-focus"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Camera className="w-4 h-4 text-muted-foreground" />
              Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Visitor preview" 
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-secondary/30"
                >
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Take a photo or upload from device
                </p>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Purpose of Visit *
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the purpose of your visit..."
                    className="input-focus min-h-[100px] resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full btn-primary h-12 text-base font-medium"
          >
            Complete Check-in
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
