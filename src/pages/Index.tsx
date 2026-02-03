import { useCallback } from 'react';
import { Users, Clock } from 'lucide-react';
import { VisitorForm } from '@/components/visitor/VisitorForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVisitorsDB, VisitorFormData } from '@/hooks/useVisitorsDB';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useAuth } from '@/contexts/AuthContext';
import { Visitor } from '@/types/visitor';

const Index = () => {
  const { addVisitor, getCheckedInCount, getTodayVisitorCount } = useVisitorsDB();
  const { checkInVisitor: kioskCheckIn } = useKioskMode();
  const { user, isStaff } = useAuth();

  // Handle visitor check-in - uses kiosk mode for guests, DB for staff
  const handleAddVisitor = useCallback(async (data: VisitorFormData): Promise<Visitor> => {
    // Non-authenticated users use kiosk mode (no DB write)
    if (!user || !isStaff) {
      return kioskCheckIn(data);
    }

    // Staff members write to DB
    const result = await addVisitor(data);
    
    if (result) {
      return {
        id: result.id,
        badgeId: result.badge_id,
        fullName: result.full_name,
        phoneNumber: result.phone_number,
        email: result.email || undefined,
        companyName: result.company_name,
        hostName: result.host_name,
        hostEmail: result.host_email || undefined,
        purpose: result.purpose,
        checkInTime: result.check_in_time,
        checkOutTime: result.check_out_time || undefined,
        status: result.status,
      };
    }

    // Fallback to kiosk mode if DB insert fails
    return kioskCheckIn(data);
  }, [user, isStaff, addVisitor, kioskCheckIn]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Welcome Banner */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome to VisitorHub
          </h1>
          <p className="text-muted-foreground text-lg">
            Please complete the check-in form below
          </p>
        </div>

        {/* Quick Stats - Only show for authenticated staff */}
        {user && isStaff && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card-elevated p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{getCheckedInCount()}</p>
                <p className="text-sm text-muted-foreground">Current Visitors</p>
              </div>
            </div>
            <div className="card-elevated p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{getTodayVisitorCount()}</p>
                <p className="text-sm text-muted-foreground">Today's Visitors</p>
              </div>
            </div>
          </div>
        )}

        {/* Visitor Form */}
        <VisitorForm onSubmit={handleAddVisitor} />

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            By checking in, you agree to our visitor policies and safety guidelines.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
