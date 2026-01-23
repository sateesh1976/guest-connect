import { Users, UserCheck, UserMinus, Clock, ScanLine } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { VisitorTable } from '@/components/dashboard/VisitorTable';
import { ScannerDialog } from '@/components/scanner/ScannerDialog';
import { useVisitorsDB, DBVisitor } from '@/hooks/useVisitorsDB';
import { Visitor } from '@/types/visitor';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { visitors, isLoading, checkOutVisitor, getCheckedInCount, getTodayVisitorCount, findVisitorByBadgeId } = useVisitorsDB();

  // Convert DBVisitor to Visitor type for components
  const convertToVisitor = (dbVisitor: DBVisitor): Visitor => ({
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
  });

  const visitorsList: Visitor[] = visitors.map(convertToVisitor);

  // Calculate checked out today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkedOutToday = visitors.filter(
    v => v.check_out_time && new Date(v.check_out_time) >= today
  ).length;

  // Calculate average visit duration for completed visits
  const avgDuration = () => {
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
  };

  const handleScanCheckOut = async (badgeId: string): Promise<boolean> => {
    const visitor = findVisitorByBadgeId(badgeId);
    if (!visitor) return false;
    if (visitor.status === 'checked-out') return false;
    return await checkOutVisitor(visitor.id);
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

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Manage visitor check-ins and check-outs</p>
        </div>
        <ScannerDialog onCheckOut={handleScanCheckOut}>
          <Button className="btn-primary">
            <ScanLine className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>
        </ScannerDialog>
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
          value={avgDuration()}
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
