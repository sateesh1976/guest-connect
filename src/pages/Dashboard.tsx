import { useCallback, useMemo } from 'react';
import { Users, UserCheck, UserMinus, Clock, ScanLine, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { VisitorTable } from '@/components/dashboard/VisitorTable';
import { ScannerDialog } from '@/components/scanner/ScannerDialog';
import { useVisitorsDB, DBVisitor } from '@/hooks/useVisitorsDB';
import { Visitor } from '@/types/visitor';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';

const Dashboard = () => {
  const { 
    visitors, 
    isLoading, 
    error,
    checkOutVisitor, 
    getCheckedInCount, 
    getTodayVisitorCount, 
    findVisitorByBadgeId,
    refetch 
  } = useVisitorsDB();

  // Convert DBVisitor to Visitor type for components
  const convertToVisitor = useCallback((dbVisitor: DBVisitor): Visitor => ({
    id: dbVisitor.id,
    badgeId: dbVisitor.badge_id,
    fullName: dbVisitor.full_name,
    phoneNumber: dbVisitor.phone_number,
    email: dbVisitor.email || undefined,
    companyName: dbVisitor.company_name,
    hostName: dbVisitor.host_name,
    hostEmail: dbVisitor.host_email || undefined,
    purpose: dbVisitor.purpose,
    checkInTime: dbVisitor.check_in_time,
    checkOutTime: dbVisitor.check_out_time || undefined,
    status: dbVisitor.status,
  }), []);

  const visitorsList = useMemo(() => 
    visitors.map(convertToVisitor), 
    [visitors, convertToVisitor]
  );

  // Calculate checked out today
  const checkedOutToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visitors.filter(
      v => v.check_out_time && new Date(v.check_out_time) >= today
    ).length;
  }, [visitors]);

  // Calculate average visit duration for completed visits
  const avgDuration = useMemo(() => {
    const completedVisits = visitors.filter(v => v.check_out_time);
    if (completedVisits.length === 0) return '—';
    
    const totalMinutes = completedVisits.reduce((acc, v) => {
      const checkIn = new Date(v.check_in_time).getTime();
      const checkOut = new Date(v.check_out_time!).getTime();
      return acc + (checkOut - checkIn) / 60000;
    }, 0);
    
    const avg = totalMinutes / completedVisits.length;
    if (avg < 60) return `${Math.round(avg)}m`;
    return `${Math.round(avg / 60)}h ${Math.round(avg % 60)}m`;
  }, [visitors]);

  const handleScanCheckOut = useCallback(async (badgeId: string): Promise<boolean> => {
    const visitor = findVisitorByBadgeId(badgeId);
    if (!visitor) return false;
    if (visitor.status === 'checked-out') return false;
    return await checkOutVisitor(visitor.id);
  }, [findVisitorByBadgeId, checkOutVisitor]);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingPage text="Loading dashboard..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState 
          title="Failed to load visitors" 
          description={error}
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Manage visitor check-ins and check-outs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            className="gap-2"
            aria-label="Refresh visitor data"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <ScannerDialog onCheckOut={handleScanCheckOut}>
            <Button className="btn-primary">
              <ScanLine className="w-4 h-4 mr-2" aria-hidden="true" />
              Scan QR Code
            </Button>
          </ScannerDialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Currently In"
          value={getCheckedInCount()}
          icon={Users}
          iconColor="text-success"
          iconBgColor="bg-success/10"
        />
        <StatsCard
          title="Today's Visitors"
          value={getTodayVisitorCount()}
          icon={UserCheck}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <StatsCard
          title="Checked Out Today"
          value={checkedOutToday}
          icon={UserMinus}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
        />
        <StatsCard
          title="Avg. Visit Duration"
          value={avgDuration}
          icon={Clock}
          iconColor="text-secondary-foreground"
          iconBgColor="bg-secondary"
        />
      </div>

      {/* Visitor Table */}
      <VisitorTable 
        visitors={visitorsList} 
        onCheckOut={checkOutVisitor} 
      />
    </AppLayout>
  );
};

export default Dashboard;
