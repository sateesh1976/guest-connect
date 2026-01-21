import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { VisitorTable } from '@/components/dashboard/VisitorTable';
import { useVisitors } from '@/hooks/useVisitors';
import { Users, UserCheck, UserMinus, Clock } from 'lucide-react';

const Dashboard = () => {
  const { visitors, checkOutVisitor, getCheckedInCount, getTodayVisitorCount } = useVisitors();

  const checkedOutToday = visitors.filter(v => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return v.status === 'checked-out' && v.checkOutTime && new Date(v.checkOutTime) >= today;
  }).length;

  const avgDuration = () => {
    const completedVisits = visitors.filter(v => v.checkOutTime);
    if (completedVisits.length === 0) return '0h';
    
    const totalMinutes = completedVisits.reduce((acc, v) => {
      const checkIn = new Date(v.checkInTime).getTime();
      const checkOut = new Date(v.checkOutTime!).getTime();
      return acc + (checkOut - checkIn) / 60000;
    }, 0);
    
    const avgMinutes = totalMinutes / completedVisits.length;
    const hours = Math.floor(avgMinutes / 60);
    const mins = Math.round(avgMinutes % 60);
    
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all visitor activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Currently In"
            value={getCheckedInCount()}
            subtitle="Active visitors"
            icon={<UserCheck className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="Today's Visitors"
            value={getTodayVisitorCount()}
            subtitle="Total check-ins"
            icon={<Users className="w-6 h-6 text-primary" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Checked Out"
            value={checkedOutToday}
            subtitle="Completed visits today"
            icon={<UserMinus className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="Avg. Duration"
            value={avgDuration()}
            subtitle="Per visit"
            icon={<Clock className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Visitor Table */}
        <VisitorTable 
          visitors={visitors} 
          onCheckOut={checkOutVisitor} 
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
