import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  FileSignature,
  FolderKanban,
  Settings,
  LogOut,
  ChevronLeft,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: Target },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Contracts', href: '/contracts', icon: FileSignature },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DD</span>
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Deal Desk</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">DD</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'absolute -right-4 top-6 bg-card border shadow-soft')}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            location.pathname === '/settings'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Settings className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full',
            'text-destructive hover:bg-destructive/10 transition-all duration-200'
          )}
        >
          <LogOut className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
