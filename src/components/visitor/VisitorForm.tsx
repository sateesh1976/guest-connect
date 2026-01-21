import { useState } from 'react';
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
  ArrowRight
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
import { VisitorFormData } from '@/types/visitor';
import { cn } from '@/lib/utils';

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
  onSubmit: (data: VisitorFormData) => void;
}

export function VisitorForm({ onSubmit }: VisitorFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

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
    onSubmit(formData);
    setSubmittedName(values.fullName);
    setIsSubmitted(true);
  };

  const handleNewCheckIn = () => {
    form.reset();
    setIsSubmitted(false);
    setSubmittedName('');
  };

  if (isSubmitted) {
    return (
      <div className="card-elevated p-8 md:p-12 text-center fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome, {submittedName}!
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          You've been successfully checked in. Your host has been notified and will meet you shortly.
        </p>
        <Button 
          onClick={handleNewCheckIn}
          className="btn-primary"
        >
          New Check-in
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
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
