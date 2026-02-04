import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart as RechartsBarChart, Users, Building2, TrendingUp, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { useVisitorsDB } from '@/hooks/useVisitorsDB';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DateRangeFilter, DateRange } from '@/components/reports/DateRangeFilter';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

const Reports = () => {
  const { visitors, isLoading, error, refetch } = useVisitorsDB();
  
  // Default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  // Filter visitors by date range
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const checkIn = new Date(v.check_in_time);
      return isWithinInterval(checkIn, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
    });
  }, [visitors, dateRange]);

  // Calculate number of days in range for daily data
  const daysInRange = useMemo(() => {
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [dateRange]);

  // Daily data for the selected range
  const dailyData = useMemo(() => {
    return Array.from({ length: Math.min(daysInRange, 31) }, (_, i) => {
      const date = subDays(dateRange.to, Math.min(daysInRange, 31) - 1 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const count = visitors.filter(v => {
        const checkIn = new Date(v.check_in_time);
        return checkIn >= dayStart && checkIn <= dayEnd;
      }).length;
      return {
        name: format(date, daysInRange > 14 ? 'MMM d' : 'EEE'),
        visitors: count,
      };
    });
  }, [visitors, dateRange, daysInRange]);

  // Company distribution
  const companyData = useMemo(() => {
    const companyCount: Record<string, number> = {};
    filteredVisitors.forEach(v => {
      companyCount[v.company_name] = (companyCount[v.company_name] || 0) + 1;
    });
    return Object.entries(companyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredVisitors]);

  // Purpose distribution
  const purposeData = useMemo(() => {
    const purposeKeywords = ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Other'];
    return purposeKeywords.map(keyword => ({
      name: keyword,
      value: filteredVisitors.filter(v => 
        v.purpose.toLowerCase().includes(keyword.toLowerCase()) ||
        (keyword === 'Other' && !purposeKeywords.slice(0, -1).some(k => 
          v.purpose.toLowerCase().includes(k.toLowerCase())
        ))
      ).length,
    })).filter(d => d.value > 0);
  }, [filteredVisitors]);

  // Top hosts
  const topHosts = useMemo(() => {
    const hostCount: Record<string, number> = {};
    filteredVisitors.forEach(v => {
      hostCount[v.host_name] = (hostCount[v.host_name] || 0) + 1;
    });
    return Object.entries(hostCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredVisitors]);

  // Stats
  const totalVisitors = filteredVisitors.length;
  const uniqueCompanies = new Set(filteredVisitors.map(v => v.company_name)).size;
  const dailyAverage = Math.round(totalVisitors / Math.max(daysInRange, 1));

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingPage text="Loading reports..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState 
          title="Failed to load reports" 
          description={error}
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights on visitor activity</p>
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Visitors"
          value={totalVisitors}
          icon={Users}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <StatsCard
          title="Unique Companies"
          value={uniqueCompanies}
          icon={Building2}
          iconColor="text-success"
          iconBgColor="bg-success/10"
        />
        <StatsCard
          title="Period Total"
          value={totalVisitors}
          icon={TrendingUp}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
        />
        <StatsCard
          title="Daily Average"
          value={dailyAverage}
          icon={Clock}
          iconColor="text-secondary-foreground"
          iconBgColor="bg-secondary"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Trend */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Visitor Trend</h3>
          <div className="h-[280px]">
            {dailyData.some(d => d.visitors > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} role="img" aria-label="Visitor trend bar chart">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <RechartsBarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No visitor data for selected period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purpose Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Visit Purpose Distribution</h3>
          <div className="h-[280px]">
            {purposeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart role="img" aria-label="Visit purpose distribution pie chart">
                  <Pie
                    data={purposeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {purposeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Companies</h3>
          {companyData.length > 0 ? (
            <div className="space-y-3">
              {companyData.map((company, index) => (
                <div key={company.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{company.name}</p>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(company.value / companyData[0].value) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {company.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No data available</p>
          )}
        </div>

        {/* Top Hosts */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Hosts</h3>
          {topHosts.length > 0 ? (
            <div className="space-y-3">
              {topHosts.map(([name, count], index) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-xs font-medium text-success">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{name}</p>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-success h-1.5 rounded-full transition-all"
                        style={{ width: `${(count / topHosts[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No data available</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
