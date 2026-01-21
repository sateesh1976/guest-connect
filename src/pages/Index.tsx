import { VisitorForm } from '@/components/visitor/VisitorForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVisitors } from '@/hooks/useVisitors';
import { Users, Clock, Building2 } from 'lucide-react';

const Index = () => {
  const { addVisitor, getCheckedInCount, getTodayVisitorCount } = useVisitors();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Welcome Banner */}
        <div className="mb-8 fade-in">
          <div className="card-elevated p-6 md:p-8 gradient-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <Building2 className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome to VisitorHub
              </h1>
              <p className="text-primary-foreground/80 max-w-lg">
                Please check in below. Your host will be notified immediately upon your arrival.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-6 mt-6 relative z-10">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-medium">{getCheckedInCount()}</span>
                <span className="text-primary-foreground/70">Currently In</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{getTodayVisitorCount()}</span>
                <span className="text-primary-foreground/70">Today's Visitors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Form */}
        <VisitorForm onSubmit={addVisitor} />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground fade-in">
          <p>
            By checking in, you agree to our visitor policies. 
            Please wear your visitor badge at all times.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
