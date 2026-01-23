import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Building2, TrendingUp, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVisitorsDB } from '@/hooks/useVisitorsDB';
import { StatsCard } from '@/components/dashboard/StatsCard';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

const Reports = () => {
  const { visitors, isLoading } = useVisitorsDB();

  // Weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const count = visitors.filter(v => {
      const checkIn = new Date(v.check_in_time);
      return checkIn >= dayStart && checkIn <= dayEnd;
    }).length;
    return {
      name: format(date, 'EEE'),
      visitors: count,
    };
  });

  // Company distribution
  const companyCount: Record<string, number> = {};
  visitors.forEach(v => {
    companyCount[v.company_name] = (companyCount[v.company_name] || 0) + 1;
  });
  const companyData = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Purpose distribution
  const purposeKeywords = ['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Other'];
  const purposeData = purposeKeywords.map(keyword => ({
    name: keyword,
    value: visitors.filter(v => 
      v.purpose.toLowerCase().includes(keyword.toLowerCase()) ||
      (keyword === 'Other' && !purposeKeywords.slice(0, -1).some(k => 
        v.purpose.toLowerCase().includes(k.toLowerCase())
      ))
    ).length,
  })).filter(d => d.value > 0);

  // Top hosts
  const hostCount: Record<string, number> = {};
  visitors.forEach(v => {
    hostCount[v.host_name] = (hostCount[v.host_name] || 0) + 1;
  });
  const topHosts = Object.entries(hostCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Stats
  const totalVisitors = visitors.length;
  const uniqueCompanies = new Set(visitors.map(v => v.company_name)).size;

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Reports</h1>
        <p className="text-muted-foreground">Analytics and insights on visitor activity</p>
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
          title="This Week"
          value={weeklyData.reduce((sum, d) => sum + d.visitors, 0)}
          icon={TrendingUp}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
        />
        <StatsCard
          title="Daily Average"
          value={Math.round(weeklyData.reduce((sum, d) => sum + d.visitors, 0) / 7)}
          icon={Clock}
          iconColor="text-secondary-foreground"
          iconBgColor="bg-secondary"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Trend */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Visitor Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
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
          </div>
        </div>

        {/* Purpose Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Visit Purpose Distribution</h3>
          <div className="h-[280px]">
            {purposeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
