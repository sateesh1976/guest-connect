import { useState } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Plus, Calendar, Clock, Building2, User, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePreRegistrations, PreRegistrationFormData } from '@/hooks/usePreRegistrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formSchema = z.object({
  visitor_name: z.string().min(2, 'Name must be at least 2 characters'),
  visitor_email: z.string().email('Invalid email').optional().or(z.literal('')),
  visitor_phone: z.string().optional(),
  visitor_company: z.string().optional(),
  expected_date: z.string().min(1, 'Date is required'),
  expected_time: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  'checked-in': { label: 'Checked In', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  expired: { label: 'Expired', icon: AlertCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const PreRegistration = () => {
  const { preRegistrations, isLoading, addPreRegistration, cancelPreRegistration } = usePreRegistrations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'today'>('pending');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitor_name: '',
      visitor_email: '',
      visitor_phone: '',
      visitor_company: '',
      expected_date: '',
      expected_time: '',
      purpose: '',
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData: PreRegistrationFormData = {
      visitor_name: values.visitor_name,
      visitor_email: values.visitor_email || undefined,
      visitor_phone: values.visitor_phone || undefined,
      visitor_company: values.visitor_company || undefined,
      expected_date: values.expected_date,
      expected_time: values.expected_time || undefined,
      purpose: values.purpose || undefined,
      notes: values.notes || undefined,
    };

    const result = await addPreRegistration(formData);
    if (result) {
      form.reset();
      setIsDialogOpen(false);
    }
  };

  const filteredRegistrations = preRegistrations.filter(pr => {
    if (filter === 'pending') return pr.status === 'pending';
    if (filter === 'today') return pr.expected_date === new Date().toISOString().split('T')[0];
    return true;
  });

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const todayCount = preRegistrations.filter(
    pr => pr.expected_date === new Date().toISOString().split('T')[0] && pr.status === 'pending'
  ).length;

  return (
    <AppLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Pre-Registration</h1>
          <p className="text-muted-foreground">Pre-register expected visitors for streamlined check-in</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Pre-Register Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pre-Register Visitor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="visitor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visitor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visitor_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visitor_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="visitor_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expected_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Date *</FormLabel>
                        <FormControl>
                          <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expected_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
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
                      <FormLabel>Purpose of Visit</FormLabel>
                      <FormControl>
                        <Input placeholder="Meeting, Interview, Delivery..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    Pre-Register
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats & Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="py-1.5 px-3">
            <Calendar className="h-4 w-4 mr-2" />
            {todayCount} expected today
          </Badge>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pre-registrations List */}
      {filteredRegistrations.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No pre-registrations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations.map((pr) => {
            const StatusIcon = statusConfig[pr.status].icon;
            const isExpired = pr.status === 'pending' && isPast(parseISO(pr.expected_date + 'T23:59:59'));
            
            return (
              <Card key={pr.id} className="card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pr.visitor_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {pr.visitor_company && (
                            <>
                              <Building2 className="h-3 w-3" />
                              {pr.visitor_company}
                            </>
                          )}
                          {pr.visitor_email && (
                            <span className="text-xs">• {pr.visitor_email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusConfig[isExpired ? 'expired' : pr.status].className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[isExpired ? 'expired' : pr.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {getDateLabel(pr.expected_date)}
                      </span>
                      {pr.expected_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {pr.expected_time}
                        </span>
                      )}
                      {pr.purpose && (
                        <span>• {pr.purpose}</span>
                      )}
                    </div>
                    {pr.status === 'pending' && !isExpired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelPreRegistration(pr.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                  {pr.notes && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {pr.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default PreRegistration;
