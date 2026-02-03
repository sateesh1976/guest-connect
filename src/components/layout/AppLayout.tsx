import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings,
  Building2,
  LogIn,
  LogOut,
  Shield,
  UserCog,
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, isAdmin, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Visitor Check-in', shortLabel: 'Check-in', icon: LogIn, requireAuth: false },
    { path: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: ClipboardList, requireAuth: true },
    { path: '/pre-registration', label: 'Pre-Register', shortLabel: 'Pre-Reg', icon: CalendarPlus, requireAuth: true },
    { path: '/reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3, requireAuth: true },
    ...(isAdmin ? [
      { path: '/users', label: 'Users', shortLabel: 'Users', icon: UserCog, requireAuth: true },
      { path: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings, requireAuth: true },
    ] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">VisitorHub</h1>
              <p className="text-xs text-muted-foreground">Visitor Management</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.requireAuth && !user) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-link',
                    isActive && 'nav-link-active'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                        {user.email?.split('@')[0]}
                      </p>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {userRole === 'admin' && <Shield className="w-2.5 h-2.5 mr-1" />}
                        {userRole || 'user'}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                <LogIn className="w-4 h-4 mr-2" />
                Staff Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.filter(item => !item.requireAuth || user).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 focus-ring',
                  isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-medium truncate max-w-[70px]">
                  {item.shortLabel || item.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
