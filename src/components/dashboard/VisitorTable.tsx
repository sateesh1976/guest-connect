import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Download, 
  LogOut, 
  Filter,
  ChevronDown,
  MoreHorizontal,
  Users,
  Eye,
  Home,
  Car,
  Package,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Visitor } from '@/types/visitor';
import { cn } from '@/lib/utils';
import { VisitorDetailsDialog } from './VisitorDetailsDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

interface VisitorTableProps {
  visitors: Visitor[];
  onCheckOut: (id: string) => Promise<boolean> | boolean;
}

type FilterStatus = 'all' | 'checked-in' | 'checked-out';
type FilterType = 'all' | 'guest' | 'delivery' | 'cab' | 'service' | 'other';

const typeConfig: Record<string, { label: string; icon: typeof Users; className: string }> = {
  guest: { label: 'Guest', icon: Users, className: 'bg-primary/10 text-primary' },
  delivery: { label: 'Delivery', icon: Package, className: 'bg-accent/10 text-accent' },
  cab: { label: 'Cab', icon: Car, className: 'bg-warning/10 text-warning' },
  service: { label: 'Service', icon: Wrench, className: 'bg-success/10 text-success' },
  other: { label: 'Other', icon: Users, className: 'bg-muted text-muted-foreground' },
};

export function VisitorTable({ visitors, onCheckOut }: VisitorTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const { toast } = useToast();

  const handleViewDetails = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setDetailsOpen(true);
  };

  const handleCheckOut = useCallback(async (visitor: Visitor) => {
    setCheckingOut(visitor.id);
    try {
      const result = await onCheckOut(visitor.id);
      if (!result) {
        toast({
          title: 'Check-out Failed',
          description: `Could not check out ${visitor.fullName}. Please try again.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Check-out error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during check-out.',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(null);
    }
  }, [onCheckOut, toast]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      const matchesSearch = 
        visitor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (visitor.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (visitor.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesStatus = 
        statusFilter === 'all' || visitor.status === statusFilter;

      const matchesType =
        typeFilter === 'all' || visitor.visitorType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [visitors, searchQuery, statusFilter, typeFilter]);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Type',
      'Company',
      'Flat/Unit',
      'Vehicle',
      'Host',
      'Purpose',
      'Check-in Time',
      'Check-out Time',
      'Status'
    ];

    const rows = filteredVisitors.map(v => [
      v.fullName,
      v.phoneNumber,
      v.email || '',
      v.visitorType || 'guest',
      v.companyName,
      v.flatNumber || '',
      v.vehicleNumber || '',
      v.hostName,
      v.purpose,
      format(new Date(v.checkInTime), 'yyyy-MM-dd HH:mm'),
      v.checkOutTime ? format(new Date(v.checkOutTime), 'yyyy-MM-dd HH:mm') : '',
      v.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `visitors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [filteredVisitors]);

  return (
    <div className="card-elevated fade-in">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, company, flat, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {statusFilter === 'all' ? 'All Status' : 
                 statusFilter === 'checked-in' ? 'Checked In' : 'Checked Out'}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('checked-in')}>Checked In</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('checked-out')}>Checked Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                {typeFilter === 'all' ? 'All Types' : typeConfig[typeFilter]?.label || typeFilter}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('guest')}>Guest</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('delivery')}>Delivery</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('cab')}>Cab</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('service')}>Service</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('other')}>Other</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead className="w-[200px]">Visitor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Flat / Unit</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No visitors found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'Try adjusting your search or filters' 
                          : 'Visitors will appear here once they check in'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor) => {
                const vType = typeConfig[visitor.visitorType || 'guest'] || typeConfig.guest;
                const TypeIcon = vType.icon;
                return (
                  <TableRow key={visitor.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{visitor.fullName}</p>
                        <p className="text-sm text-muted-foreground">{visitor.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', vType.className)}>
                        <TypeIcon className="w-3 h-3" />
                        {vType.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {visitor.flatNumber ? (
                        <span className="flex items-center gap-1 text-foreground">
                          <Home className="w-3.5 h-3.5 text-muted-foreground" />
                          {visitor.flatNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground">{visitor.hostName}</p>
                        {visitor.vehicleNumber && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {visitor.vehicleNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-foreground">
                          {format(new Date(visitor.checkInTime), 'MMM d, yyyy')}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(visitor.checkInTime), 'h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-medium",
                          visitor.status === 'checked-in' 
                            ? 'status-checked-in' 
                            : 'status-checked-out'
                        )}
                      >
                        {visitor.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {visitor.status === 'checked-in' && (
                          <ConfirmDialog
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={checkingOut === visitor.id}
                                aria-label={`Check out ${visitor.fullName}`}
                              >
                                <LogOut className="w-3 h-3" aria-hidden="true" />
                                <span className="hidden sm:inline">
                                  {checkingOut === visitor.id ? 'Checking out...' : 'Check Out'}
                                </span>
                              </Button>
                            }
                            title="Confirm Check-out"
                            description={`Are you sure you want to check out ${visitor.fullName} from ${visitor.companyName}?`}
                            confirmText="Check Out"
                            onConfirm={() => handleCheckOut(visitor)}
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" aria-label={`More actions for ${visitor.fullName}`}>
                              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(visitor)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing {filteredVisitors.length} of {visitors.length} visitors</p>
      </div>

      {/* Visitor Details Dialog */}
      <VisitorDetailsDialog
        visitor={selectedVisitor}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
