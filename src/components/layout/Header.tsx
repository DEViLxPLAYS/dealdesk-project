import { Bell, Search, Plus, UserPlus, Briefcase, FileText, FileSignature, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddClientClick?: () => void;
  onAddDealClick?: () => void;
}

export function Header({ title, subtitle, onAddClientClick, onAddDealClick }: HeaderProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { company } = useCompany();

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-base sm:text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search — hidden on small screens */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-52 lg:w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary text-sm h-9"
          />
        </div>

        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="accent" size="sm" className="gap-1.5 shadow-sm hover:scale-105 transition-transform h-9 px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold text-sm">Quick Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl">
            {[
              { label: 'New Client',   sub: 'Add to Roster',    icon: UserPlus,      cls: 'bg-primary/10', icls: 'text-primary',       action: () => { if (onAddClientClick) onAddClientClick(); navigate('/clients', { state: { openNewClient: true } }); } },
              { label: 'New Deal',     sub: 'Add to Pipeline',  icon: Briefcase,     cls: 'bg-success/10', icls: 'text-success',        action: () => { if (onAddDealClick) onAddDealClick(); navigate('/pipeline', { state: { openNewDeal: true } }); } },
              { label: 'New Invoice',  sub: 'Bill a Client',    icon: FileText,      cls: 'bg-amber-500/10', icls: 'text-amber-500',    action: () => navigate('/invoices', { state: { openCreateInvoice: true } }) },
              { label: 'New Contract', sub: 'Sign Agreement',   icon: FileSignature, cls: 'bg-violet-500/10', icls: 'text-violet-500',  action: () => navigate('/contracts', { state: { openCreateContract: true } }) },
              { label: 'New Project',  sub: 'Manage Work',      icon: FolderKanban,  cls: 'bg-pink-500/10', icls: 'text-pink-500',      action: () => navigate('/projects', { state: { openCreateProject: true } }) },
            ].map(item => (
              <DropdownMenuItem key={item.label} className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg" onClick={item.action}>
                <div className={`p-1.5 ${item.cls} rounded-md flex-shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.icls}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.sub}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">3</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { title: 'Invoice Paid', desc: 'A client paid their invoice' },
              { title: 'New Lead', desc: 'New lead added to pipeline' },
              { title: 'Contract Signed', desc: 'Client signed the agreement' },
            ].map(n => (
              <DropdownMenuItem key={n.title} className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium text-sm">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.desc}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{company?.name || 'My Company'}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
