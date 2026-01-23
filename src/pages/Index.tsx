import { Users, Clock, Building2 } from 'lucide-react';
import { VisitorForm } from '@/components/visitor/VisitorForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { useVisitorsDB, VisitorFormData, DBVisitor } from '@/hooks/useVisitorsDB';
import { useAuth } from '@/contexts/AuthContext';
import { Visitor } from '@/types/visitor';

const Index = () => {
  const { addVisitor, getCheckedInCount, getTodayVisitorCount } = useVisitorsDB();
  const { user, isStaff } = useAuth();

  // Convert DBVisitor to Visitor type for the form
  const handleAddVisitor = async (data: VisitorFormData): Promise<Visitor> => {
    if (!user || !isStaff) {
      // For non-authenticated users, return a mock visitor (check-in kiosk mode)
      const mockVisitor: Visitor = {
        id: crypto.randomUUID(),
        badgeId: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        companyName: data.companyName,
        hostName: data.hostName,
        hostEmail: data.hostEmail,
        purpose: data.purpose,
        checkInTime: new Date().toISOString(),
        status: 'checked-in',
      };
      return mockVisitor;
    }

    const result = await addVisitor(data);
    
    if (result) {
      // Convert DBVisitor to Visitor
      const visitor: Visitor = {
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
      return visitor;
    }

    // Fallback mock visitor if DB insert fails
    return {
      id: crypto.randomUUID(),
      badgeId: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      companyName: data.companyName,
      hostName: data.hostName,
      hostEmail: data.hostEmail,
      purpose: data.purpose,
      checkInTime: new Date().toISOString(),
      status: 'checked-in',
    };
  };

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
