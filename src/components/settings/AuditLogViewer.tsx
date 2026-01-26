import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Shield, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  UserCog,
  Webhook,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { cn } from '@/lib/utils';

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  role_assigned: { label: 'Role Assigned', variant: 'default' },
  role_removed: { label: 'Role Removed', variant: 'destructive' },
  role_updated: { label: 'Role Updated', variant: 'secondary' },
  webhook_created: { label: 'Webhook Created', variant: 'default' },
  webhook_updated: { label: 'Webhook Updated', variant: 'secondary' },
  webhook_deleted: { label: 'Webhook Deleted', variant: 'destructive' },
};

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  user_roles: UserCog,
  webhook_settings: Webhook,
};

function AuditLogRow({ log }: { log: AuditLog }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'outline' as const };
  const ResourceIcon = RESOURCE_ICONS[log.resource_type] || Shield;

  const hasDetails = log.old_values || log.new_values || log.metadata;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className={cn(hasDetails && 'cursor-pointer hover:bg-muted/50')}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {format(new Date(log.created_at), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(log.created_at), 'h:mm:ss a')}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <ResourceIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{log.resource_type}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {log.resource_id ? log.resource_id.substring(0, 8) + '...' : '-'}
        </TableCell>
        <TableCell>
          {hasDetails && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </TableCell>
      </TableRow>
      {hasDetails && (
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30">
            <TableCell colSpan={5} className="p-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {log.old_values && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Previous Values</p>
                    <pre className="bg-secondary/50 rounded p-2 text-xs overflow-auto max-h-32">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_values && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">New Values</p>
                    <pre className="bg-secondary/50 rounded p-2 text-xs overflow-auto max-h-32">
                      {JSON.stringify(log.new_values, null, 2)}
                    </pre>
                  </div>
                )}
                {log.metadata && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Metadata</p>
                    <pre className="bg-secondary/50 rounded p-2 text-xs overflow-auto max-h-32">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function AuditLogViewer() {
  const { logs, isLoading, refetch } = useAuditLogs();

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
            <p className="text-sm text-muted-foreground">
              Track role changes and sensitive operations
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No audit logs found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Logs will appear when role changes or webhook modifications occur
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
