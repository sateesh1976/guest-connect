import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Download, 
  LogOut, 
  Filter,
  ChevronDown,
  MoreHorizontal,
  Users,
  Eye
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

interface VisitorTableProps {
  visitors: Visitor[];
  onCheckOut: (id: string) => void;
}

type FilterStatus = 'all' | 'checked-in' | 'checked-out';

export function VisitorTable({ visitors, onCheckOut }: VisitorTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setDetailsOpen(true);
  };
  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      const matchesSearch = 
        visitor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.hostName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || visitor.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchQuery, statusFilter]);

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Company',
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
      v.companyName,
      v.hostName,
      v.purpose,
      format(new Date(v.checkInTime), 'yyyy-MM-dd HH:mm'),
      v.checkOutTime ? format(new Date(v.checkOutTime), 'yyyy-MM-dd HH:mm') : '',
      v.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="card-elevated fade-in">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or host..."
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
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('checked-in')}>
                Checked In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('checked-out')}>
                Checked Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead className="w-[200px]">Visitor</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Purpose</TableHead>
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
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filter' 
                          : 'Visitors will appear here once they check in'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor) => (
                <TableRow key={visitor.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{visitor.fullName}</p>
                      <p className="text-sm text-muted-foreground">{visitor.phoneNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{visitor.companyName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground">{visitor.hostName}</p>
                      {visitor.hostEmail && (
                        <p className="text-sm text-muted-foreground">{visitor.hostEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-foreground truncate">{visitor.purpose}</p>
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
                      {visitor.status === 'checked-in' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCheckOut(visitor.id)}
                          className="gap-2"
                        >
                          <LogOut className="w-3 h-3" />
                          Check Out
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
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
              ))
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
