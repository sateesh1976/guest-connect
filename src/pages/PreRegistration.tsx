import { useCallback, useMemo } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Plus, Calendar, Clock, Building2, User, XCircle, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePreRegistrations, PreRegistrationFormData } from '@/hooks/usePreRegistrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  visitor_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  visitor_email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  visitor_phone: z.string().trim().max(20).optional(),
  visitor_company: z.string().trim().max(100).optional(),
  expected_date: z.string().min(1, 'Date is required'),
  expected_time: z.string().optional(),
  purpose: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  'checked-in': { label: 'Checked In', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  expired: { label: 'Expired', icon: AlertCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const PreRegistration = () => {
  const { preRegistrations, isLoading, addPreRegistration, cancelPreRegistration, refetch } = usePreRegistrations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'today'>('pending');

  const form = useForm<FormData>({
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
    mode: 'onBlur',
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const formData: PreRegistrationFormData = {
        visitor_name: values.visitor_name.trim(),
        visitor_email: values.visitor_email?.trim() || undefined,
        visitor_phone: values.visitor_phone?.trim() || undefined,
        visitor_company: values.visitor_company?.trim() || undefined,
        expected_date: values.expected_date,
        expected_time: values.expected_time || undefined,
        purpose: values.purpose?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      const result = await addPreRegistration(formData);
      if (result) {
        form.reset();
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegistrations = useMemo(() => preRegistrations.filter(pr => {
    if (filter === 'pending') return pr.status === 'pending';
    if (filter === 'today') return pr.expected_date === new Date().toISOString().split('T')[0];
    return true;
  }), [preRegistrations, filter]);

  const getDateLabel = useCallback((dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  }, []);

  const todayCount = useMemo(() => preRegistrations.filter(
    pr => pr.expected_date === new Date().toISOString().split('T')[0] && pr.status === 'pending'
  ).length, [preRegistrations]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading pre-registrations...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Pre-Registration</h1>
          <p className="text-muted-foreground">Pre-register expected visitors for streamlined check-in</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Pre-Register Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pre-Register Visitor</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitor_name">Visitor Name *</Label>
                <Input 
                  id="visitor_name"
                  placeholder="John Doe" 
                  autoComplete="name"
                  {...form.register('visitor_name')} 
                />
                {form.formState.errors.visitor_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.visitor_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitor_email">Email</Label>
                  <Input 
                    id="visitor_email"
                    type="email" 
                    placeholder="john@example.com" 
                    autoComplete="email"
                    {...form.register('visitor_email')} 
                  />
                  {form.formState.errors.visitor_email && (
                    <p className="text-sm text-destructive">{form.formState.errors.visitor_email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitor_phone">Phone</Label>
                  <Input 
                    id="visitor_phone"
                    placeholder="+1 234 567 890" 
                    autoComplete="tel"
                    {...form.register('visitor_phone')} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitor_company">Company</Label>
                <Input 
                  id="visitor_company"
                  placeholder="Acme Corp" 
                  autoComplete="organization"
                  {...form.register('visitor_company')} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_date">Expected Date *</Label>
                  <Input 
                    id="expected_date"
                    type="date" 
                    min={new Date().toISOString().split('T')[0]} 
                    {...form.register('expected_date')} 
                  />
                  {form.formState.errors.expected_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.expected_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_time">Expected Time</Label>
                  <Input 
                    id="expected_time"
                    type="time" 
                    {...form.register('expected_time')} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Input 
                  id="purpose"
                  placeholder="Meeting, Interview, Delivery..." 
                  {...form.register('purpose')} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  placeholder="Any additional notes..." 
                  className="resize-none"
                  {...form.register('notes')} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Pre-Register'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>


      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No pre-registrations found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'pending' 
                ? 'All pending registrations will appear here'
                : filter === 'today'
                  ? 'No visitors expected today'
                  : 'Start by pre-registering expected visitors'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Pre-Register Visitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations.map((pr) => {
            const StatusIcon = statusConfig[pr.status as keyof typeof statusConfig]?.icon || Clock;
            const isExpired = pr.status === 'pending' && isPast(parseISO(pr.expected_date + 'T23:59:59'));
            const displayStatus = isExpired ? 'expired' : pr.status;
            const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.pending;
            
            return (
              <Card key={pr.id} className="card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{pr.visitor_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          {pr.visitor_company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {pr.visitor_company}
                            </span>
                          )}
                          {pr.visitor_email && (
                            <span className="text-xs truncate">• {pr.visitor_email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={config.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                        className="text-destructive hover:text-destructive shrink-0"
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
