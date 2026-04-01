import { useNavigate } from 'react-router-dom';
import { Building2, Home, ArrowRight, Shield, Users, BarChart3, QrCode, CalendarPlus, Bell } from 'lucide-react';
import { useProduct, ProductType } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';

const products = [
  {
    id: 'office' as ProductType,
    title: 'Office',
    subtitle: 'Corporate & Workplace',
    description: 'Manage visitor check-ins for offices, co-working spaces, and corporate buildings.',
    icon: Building2,
    color: 'from-primary to-primary/80',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    features: [
      { icon: QrCode, label: 'QR-based check-in/out' },
      { icon: Users, label: 'Host notifications' },
      { icon: BarChart3, label: 'Visitor analytics' },
      { icon: Bell, label: 'Slack & Teams webhooks' },
    ],
  },
  {
    id: 'society' as ProductType,
    title: 'Housing Society',
    subtitle: 'Residential & Community',
    description: 'Track visitors, deliveries, and services for gated communities and housing societies.',
    icon: Home,
    color: 'from-accent to-accent/80',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    features: [
      { icon: Users, label: 'Member directory' },
      { icon: CalendarPlus, label: 'Pre-registration' },
      { icon: Shield, label: 'Gate security log' },
      { icon: BarChart3, label: 'Society reports' },
    ],
  },
];

export default function ProductSelection() {
  const { setProduct } = useProduct();
  const navigate = useNavigate();

  const handleSelect = (productId: ProductType) => {
    setProduct(productId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome to <span className="text-gradient">VisitorHub</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Choose your product to get started
        </p>
      </div>

      {/* Product Cards */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
          {products.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="card-elevated p-8 text-left group hover:border-primary/30 transition-all duration-300 focus-ring"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${p.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-7 h-7 ${p.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{p.title}</h2>
                    <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  {p.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {p.features.map((f) => {
                    const FIcon = f.icon;
                    return (
                      <div key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FIcon className="w-4 h-4 shrink-0" />
                        <span>{f.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
