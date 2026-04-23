import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Target, FileText, FileSignature,
  FolderKanban, Settings, LogOut, MessageSquare, BarChart3,
  ChevronLeft, X, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

const navigation = [
  { name: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { name: 'Clients',    href: '/clients',     icon: Users },
  { name: 'Pipeline',   href: '/pipeline',    icon: Target },
  { name: 'Invoices',   href: '/invoices',    icon: FileText },
  { name: 'Contracts',  href: '/contracts',   icon: FileSignature },
  { name: 'Projects',   href: '/projects',    icon: FolderKanban },
  { name: 'Messages',   href: '/messages',    icon: MessageSquare },
  { name: 'Reports',    href: '/reports',     icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { company } = useCompany();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth', { replace: true });
  };

  const SidebarContent = () => (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <div className={cn('flex items-center gap-2.5 overflow-hidden', collapsed && 'justify-center w-full')}>
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name}
              className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <span className="text-white font-black text-sm">
                {company?.name ? company.name.slice(0, 2).toUpperCase() : 'DD'}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base text-sidebar-foreground truncate block leading-tight">
                {company?.name || 'Deal Desk'}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                powered by Deal Desk
              </span>
            </div>
          )}
        </div>
        {/* Desktop collapse toggle */}
        {!collapsed && (
          <Button variant="ghost" size="icon" onClick={() => onCollapse(true)}
            className="h-7 w-7 hidden lg:flex flex-shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {/* Mobile close */}
        <Button variant="ghost" size="icon" onClick={onMobileClose}
          className="h-7 w-7 lg:hidden flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button onClick={() => onCollapse(false)}
          className="hidden lg:flex items-center justify-center h-8 mx-2 mt-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all">
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink key={item.name} to={item.href} onClick={onMobileClose}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}>
              <item.icon className={cn(
                'h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110',
                isActive ? 'text-white' : ''
              )} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5 flex-shrink-0">
        <NavLink to="/settings" onClick={onMobileClose}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            location.pathname === '/settings'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}>
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200',
            collapsed && 'justify-center px-0',
            'text-destructive hover:bg-destructive/10'
          )}>
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn(
        'fixed left-0 top-0 z-40 h-screen hidden lg:block transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease' }}
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div
            className="absolute left-0 top-0 h-full w-72"
            style={{ animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

// Mobile nav bar (bottom or top hamburger)
export function MobileNavBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-9 w-9">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <span className="text-white font-black text-xs">DD</span>
        </div>
        <span className="font-bold text-sm text-sidebar-foreground">Deal Desk</span>
      </div>
    </div>
  );
}
