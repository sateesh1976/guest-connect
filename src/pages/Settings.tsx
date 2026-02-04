import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Bell, 
  Plus, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Slack,
  MessageSquare
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useWebhookSettings, WebhookFormData } from '@/hooks/useWebhookSettings';
import { useAuth } from '@/contexts/AuthContext';

const webhookSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  webhookUrl: z.string().url('Please enter a valid webhook URL'),
  webhookType: z.enum(['slack', 'teams']),
  isActive: z.boolean(),
  notifyOnCheckin: z.boolean(),
  notifyOnCheckout: z.boolean(),
});

export default function Settings() {
  const { isAdmin } = useAuth();
  const { webhooks, isLoading, addWebhook, updateWebhook, deleteWebhook } = useWebhookSettings();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      webhookUrl: '',
      webhookType: 'slack',
      isActive: true,
      notifyOnCheckin: true,
      notifyOnCheckout: false,
    },
  });

  const handleSubmit = async (data: WebhookFormData) => {
    const result = await addWebhook(data);
    if (result) {
      form.reset();
      setIsAddDialogOpen(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateWebhook(id, { isActive });
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can access settings.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure webhook notifications for visitor events</p>
      </div>

      {/* Webhook Notifications Section */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Webhook Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Send notifications to Slack or Teams when visitors check in/out
              </p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
                <DialogDescription>
                  Configure a new Slack or Teams webhook for notifications
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Reception Notifications" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="slack">
                              <div className="flex items-center gap-2">
                                <Slack className="w-4 h-4" />
                                Slack
                              </div>
                            </SelectItem>
                            <SelectItem value="teams">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Microsoft Teams
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://hooks.slack.com/services/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          <a 
                            href={form.watch('webhookType') === 'slack' 
                              ? 'https://api.slack.com/messaging/webhooks'
                              : 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            How to get a webhook URL
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 pt-2">
                    <FormField
                      control={form.control}
                      name="notifyOnCheckin"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Check-in notifications</FormLabel>
                            <FormDescription>
                              Send a notification when a visitor checks in
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notifyOnCheckout"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Check-out notifications</FormLabel>
                            <FormDescription>
                              Send a notification when a visitor checks out
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full btn-primary">
                    Add Webhook
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Webhooks List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No webhooks configured</p>
            <p className="text-sm text-muted-foreground">
              Add a webhook to receive notifications when visitors check in or out
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    webhook.webhook_type === 'slack' ? 'bg-[#4A154B]/10' : 'bg-[#464EB8]/10'
                  }`}>
                    {webhook.webhook_type === 'slack' ? (
                      <Slack className="w-5 h-5 text-[#4A154B]" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-[#464EB8]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{webhook.name}</h3>
                      {webhook.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {webhook.notify_on_checkin && 'Check-in'}
                      {webhook.notify_on_checkin && webhook.notify_on_checkout && ' • '}
                      {webhook.notify_on_checkout && 'Check-out'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={(checked) => handleToggleActive(webhook.id, checked)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{webhook.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteWebhook(webhook.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs Section */}
      <div className="mt-8">
        <AuditLogViewer />
      </div>
    </AppLayout>
  );
}
