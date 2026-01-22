import { AppLayout } from '@/components/layout/AppLayout';
import { useVisitors } from '@/hooks/useVisitors';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Calendar, TrendingUp, Building, Users } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

const COLORS = ['hsl(217, 91%, 30%)', 'hsl(173, 80%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)'];

const Reports = () => {
  const { visitors } = useVisitors();

  // Weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const count = visitors.filter(v => {
      const checkIn = new Date(v.checkInTime);
      return checkIn >= dayStart && checkIn <= dayEnd;
    }).length;

    return {
      day: format(date, 'EEE'),
      date: format(date, 'MMM d'),
      visitors: count,
    };
  });

  // Company distribution
  const companyStats = visitors.reduce((acc, v) => {
    acc[v.companyName] = (acc[v.companyName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const companyData = Object.entries(companyStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Purpose distribution
  const purposeKeywords = ['Meeting', 'Demo', 'Interview', 'Delivery', 'Other'];
  const purposeData = purposeKeywords.map(keyword => {
    const count = visitors.filter(v => 
      v.purpose.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    return { name: keyword, value: count || 1 };
  });

  // Most visited hosts
  const hostStats = visitors.reduce((acc, v) => {
    acc[v.hostName] = (acc[v.hostName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topHosts = Object.entries(hostStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalVisitors = visitors.length;
  const uniqueCompanies = new Set(visitors.map(v => v.companyName)).size;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights from visitor data
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Visitors"
            value={totalVisitors}
            subtitle="All time"
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="Unique Companies"
            value={uniqueCompanies}
            subtitle="Organizations"
            icon={<Building className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="This Week"
            value={weeklyData.reduce((acc, d) => acc + d.visitors, 0)}
            subtitle="Total check-ins"
            icon={<Calendar className="w-6 h-6 text-primary" />}
          />
          <StatsCard
            title="Daily Average"
            value={Math.round(weeklyData.reduce((acc, d) => acc + d.visitors, 0) / 7)}
            subtitle="Visitors per day"
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <div className="card-elevated p-6 fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Visitor Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="visitors" 
                    fill="hsl(217, 91%, 30%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purpose Distribution */}
          <div className="card-elevated p-6 fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Visit Purpose Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purposeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
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
                      borderRadius: '8px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Companies */}
          <div className="card-elevated p-6 fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Visiting Companies</h3>
            <div className="space-y-4">
              {companyData.map((company, index) => (
                <div key={company.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{company.name}</p>
                    <div className="w-full bg-secondary rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(company.value / companyData[0].value) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {company.value} visits
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Hosts */}
          <div className="card-elevated p-6 fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Most Visited Hosts</h3>
            <div className="space-y-4">
              {topHosts.map(([host, count], index) => (
                <div key={host} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{host}</p>
                    <div className="w-full bg-secondary rounded-full h-2 mt-1">
                      <div 
                        className="gradient-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / topHosts[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count} visitors
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
